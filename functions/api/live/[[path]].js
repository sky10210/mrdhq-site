// Cloudflare Pages Functions. Credentials stay in encrypted project bindings.
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS live_rooms (room TEXT PRIMARY KEY, version TEXT NOT NULL, session_id TEXT NOT NULL DEFAULT '', track_name TEXT NOT NULL DEFAULT '', mid TEXT NOT NULL DEFAULT '', live INTEGER NOT NULL DEFAULT 0, expires INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS live_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL)`
];
const enc = new TextEncoder();
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {status, headers: {'Content-Type':'application/json', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', ...headers}});
class PublicError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const fail = (message, status) => { throw new PublicError(message, status); };
function roomName(request, env) {
  const host = new URL(request.url).hostname;
  if (env.CF_PAGES_BRANCH && env.CF_PAGES_BRANCH !== 'main') return `preview:${env.CF_PAGES_BRANCH}`;
  return ['mrdhq.com','www.mrdhq.com','mrdhub.com','www.mrdhub.com','mrdhub-site.pages.dev'].includes(host) ? 'production' : host;
}
function missing(env) { return ['CF_REALTIME_APP_ID','CF_REALTIME_APP_SECRET','LIVE_TEACHER_PASSCODE','LIVE_DB'].filter(k => !env[k]); }
function b64(bytes) { return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=',''); }
function unb64(s) { return Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')), c => c.charCodeAt(0)); }
async function key(env) { return crypto.subtle.importKey('raw', enc.encode(env.CF_REALTIME_APP_SECRET), {name:'HMAC',hash:'SHA-256'}, false, ['sign','verify']); }
async function sign(env, payload) {
  const data = b64(enc.encode(JSON.stringify({...payload, exp:Date.now()+8*60*60*1000})));
  return data+'.'+b64(new Uint8Array(await crypto.subtle.sign('HMAC',await key(env),enc.encode(data))));
}
async function verify(env, token, role, room) {
  try {
    const [data, signature, extra] = String(token || '').split('.');
    if (extra || !await crypto.subtle.verify('HMAC',await key(env),unb64(signature),enc.encode(data))) throw Error();
    const p = JSON.parse(new TextDecoder().decode(unb64(data)));
    if (p.role !== role || p.room !== room || p.exp < Date.now()) throw Error();
    return p;
  } catch { fail('Your session expired. Unlock the teacher controls or reconnect.',401); }
}
async function teacher(request, env, room) {
  const cookie = (request.headers.get('Cookie') || '').split(';').map(s=>s.trim()).find(s=>s.startsWith('mrd_live_teacher='));
  return verify(env,cookie?.slice('mrd_live_teacher='.length),'teacher',room);
}
async function equalSecret(a,b) {
  const [x,y] = await Promise.all([a,b].map(s=>crypto.subtle.digest('SHA-256',enc.encode(s))));
  const p=new Uint8Array(x),q=new Uint8Array(y); let diff=0;
  for(let i=0;i<p.length;i++) diff|=p[i]^q[i];
  return diff===0;
}
async function limit(env, request, room, action, max, windowMs) {
  const ip=request.headers.get('CF-Connecting-IP') || 'local';
  const hash=b64(new Uint8Array(await crypto.subtle.sign('HMAC',await key(env),enc.encode(room+action+ip))));
  const now=Date.now();
  const result=await env.LIVE_DB.prepare(`INSERT INTO live_limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<=? THEN 1 ELSE count+1 END, expires=CASE WHEN expires<=? THEN ? ELSE expires END RETURNING count`).bind(hash,now+windowMs,now,now,now+windowMs).first();
  if(result.count>max) fail('Too many attempts. Please wait a minute and try again.',429);
}
function sdp(value, direction) {
  if(typeof value!=='string' || value.length>100000 || !value.startsWith('v=0')) fail('Invalid camera connection details.');
  const media=value.split(/(?=^m=)/m).slice(1);
  if(media.length!==1 || !media[0].startsWith('m=video ') || !new RegExp('^a='+direction+'\\r?$','m').test(media[0])) fail('Only one-way video is supported.');
  return value;
}
async function cloud(env,path,body,method='POST') {
  const result=await fetch(`https://rtc.live.cloudflare.com/v1/apps/${encodeURIComponent(env.CF_REALTIME_APP_ID)}${path}`, {
    method,headers:{Authorization:`Bearer ${env.CF_REALTIME_APP_SECRET}`,'Content-Type':'application/json'},
    body:JSON.stringify(body),signal:AbortSignal.timeout(15000)
  });
  const data=await result.json().catch(()=>({}));
  if(!result.ok || data.errorCode || data.tracks?.some(t=>t.errorCode)) {
    if(result.status===401 || result.status===403) fail('Cloudflare rejected the Realtime app credentials. Check the saved App ID and API Token.',502);
    fail('The video service could not connect. Please retry.',502);
  }
  return data;
}
async function closeTrack(env,sessionId,mid) {
  if(sessionId && mid) await cloud(env,`/sessions/${encodeURIComponent(sessionId)}/tracks/close`,{tracks:[{mid}],force:true},'PUT');
}
async function current(env,room) { return env.LIVE_DB.prepare('SELECT * FROM live_rooms WHERE room=? AND expires>?').bind(room,Date.now()).first(); }

export async function onRequest({request,env,waitUntil}) {
  try {
    const url=new URL(request.url), action=url.pathname.replace(/^\/api\/live\/?/,'').replace(/\/$/,'');
    if(request.method!=='GET' && request.method!=='POST') return json({error:'Method not allowed.'},405);
    const absent=missing(env);
    if(action==='health' && request.method==='GET') return json({configured:absent.length===0,missing:absent});
    if(absent.length) fail('Classroom Live setup is not finished yet. The teacher can check connection setup.',503);
    if(request.method==='POST' && request.headers.get('Origin')!==url.origin) fail('Open Classroom Live from this website.',403);
    for(const sql of SCHEMA) await env.LIVE_DB.prepare(sql).run();
    const room=roomName(request,env);
    if(action==='status' && request.method==='GET') {
      const row=await current(env,room);
      return json({live:!!row?.live,version:row?.live?row.version:null});
    }
    if(action==='auth' && request.method==='GET') { await teacher(request,env,room); return json({ok:true}); }
    if(request.method!=='POST') fail('Not found.',404);
    if(!request.headers.get('Content-Type')?.startsWith('application/json')) fail('Expected JSON.',415);
    if(Number(request.headers.get('Content-Length') || 0)>110000) fail('Request is too large.',413);
    const text=await request.text(); if(text.length>110000) fail('Request is too large.',413);
    let body; try{body=JSON.parse(text);}catch{fail('Invalid request.');}
    if(!body || Array.isArray(body) || typeof body!=='object') fail('Invalid request.');
    if(action==='auth') {
      await limit(env,request,room,'auth',10,60000);
      if(!await equalSecret(String(body.passcode||'').trim().toLowerCase(),String(env.LIVE_TEACHER_PASSCODE).trim().toLowerCase())) fail('Incorrect passcode.',401);
      const token=await sign(env,{role:'teacher',room});
      return json({ok:true},200,{'Set-Cookie':`mrd_live_teacher=${token}; HttpOnly; Secure; SameSite=Strict; Path=/api/live; Max-Age=28800`});
    }
    if(action==='publish') {
      await teacher(request,env,room);
      const offer=sdp(body.sdp,'sendonly');
      if(typeof body.mid!=='string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(body.mid)) fail('Invalid video track.');
      const version=crypto.randomUUID(),trackName='document-camera',now=Date.now();
      const claim=await env.LIVE_DB.prepare(`INSERT INTO live_rooms (room,version,expires) VALUES (?,?,?) ON CONFLICT(room) DO UPDATE SET version=excluded.version,session_id='',track_name='',mid='',live=0,expires=excluded.expires WHERE live_rooms.expires<=? RETURNING version`).bind(room,version,now+60000,now).first();
      if(!claim) fail('A broadcast is already running or starting. Stop it in the original tab, or wait 90 seconds after closing that tab.',409);
      let sessionId;
      try {
        const session=await cloud(env,'/sessions/new',{}); sessionId=session.sessionId;
        if(!sessionId) throw Error('No session');
        const data=await cloud(env,`/sessions/${encodeURIComponent(sessionId)}/tracks/new`,{sessionDescription:{type:'offer',sdp:offer},tracks:[{location:'local',mid:body.mid,trackName}]});
        if(data.sessionDescription?.type!=='answer') throw Error('No answer');
        const stored=await env.LIVE_DB.prepare('UPDATE live_rooms SET session_id=?,track_name=?,mid=? WHERE room=? AND version=? AND expires>? RETURNING version').bind(sessionId,trackName,body.mid,room,version,Date.now()).first();
        if(!stored) throw Error('Broadcast superseded');
        return json({sessionDescription:data.sessionDescription,token:await sign(env,{role:'broadcaster',room,version,sessionId,mid:body.mid})});
      }catch(e){
        await env.LIVE_DB.prepare('DELETE FROM live_rooms WHERE room=? AND version=?').bind(room,version).run();
        waitUntil(closeTrack(env,sessionId,body.mid).catch(()=>{})); throw e;
      }
    }
    if(['activate','heartbeat','stop'].includes(action)) {
      const token=await verify(env,body.token,'broadcaster',room);
      if(action==='stop') {
        await env.LIVE_DB.prepare('DELETE FROM live_rooms WHERE room=? AND version=?').bind(room,token.version).run();
        waitUntil(closeTrack(env,token.sessionId,token.mid).catch(()=>{}));
        return json({ok:true});
      }
      const row=await env.LIVE_DB.prepare('UPDATE live_rooms SET live=1,expires=? WHERE room=? AND version=? AND expires>? RETURNING version').bind(Date.now()+90000,room,token.version,Date.now()).first();
      if(!row) fail('This broadcast ended. Start the camera again.',409);
      return json({ok:true});
    }
    if(action==='watch') {
      const row=await current(env,room); if(!row?.live) fail('The camera is offline.',409);
      await limit(env,request,room,'watch',180,60000); // A classroom may share one public IP.
      const session=await cloud(env,'/sessions/new',{});
      if(!session.sessionId) throw Error('No session');
      const data=await cloud(env,`/sessions/${encodeURIComponent(session.sessionId)}/tracks/new`,{tracks:[{location:'remote',sessionId:row.session_id,trackName:row.track_name}]});
      if(data.sessionDescription?.type!=='offer') fail('The camera is reconnecting. Please retry.',502);
      return json({version:row.version,sessionDescription:data.sessionDescription,token:await sign(env,{role:'viewer',room,sessionId:session.sessionId,version:row.version,mid:data.tracks?.[0]?.mid})});
    }
    if(action==='answer') {
      const token=await verify(env,body.token,'viewer',room),row=await current(env,room);
      if(!row?.live || row.version!==token.version) fail('The broadcast changed. Reconnect to the camera.',409);
      await cloud(env,`/sessions/${encodeURIComponent(token.sessionId)}/renegotiate`,{sessionDescription:{type:'answer',sdp:sdp(body.sdp,'recvonly')}},'PUT');
      return json({ok:true});
    }
    if(action==='leave') {
      const token=await verify(env,body.token,'viewer',room);
      waitUntil(closeTrack(env,token.sessionId,token.mid).catch(()=>{}));return json({ok:true});
    }
    fail('Not found.',404);
  } catch(e) {
    return json({error:e instanceof PublicError?e.message:'The live connection is temporarily unavailable. Please retry.'},e.status||503);
  }
}
