import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {onRequest} from '../functions/api/live/[[path]].js';
const video = direction => `v=0\r\ns=-\r\nt=0 0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\na=mid:0\r\na=${direction}\r\n`;
function environment() {
  const sql = new DatabaseSync(':memory:');
  const db = {prepare(query) {
    const stmt = sql.prepare(query); let args = [];
    return {bind(...a) { args = a; return this; }, async first() { return stmt.get(...args) || null; }, async run() { return stmt.run(...args); }};
  }};
  return {CF_REALTIME_APP_ID:'test-app',CF_REALTIME_APP_SECRET:'test-secret-only',LIVE_TEACHER_PASSCODE:'test-passcode',LIVE_DB:db,CF_PAGES_BRANCH:'main'};
}
async function call(env, path, body, cookie = '', origin = 'https://mrdhub-site.pages.dev') {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) { headers.Origin = origin; headers['Content-Type'] = 'application/json'; }
  const pending = [];
  const response = await onRequest({request:new Request(`https://mrdhub-site.pages.dev/api/live/${path}`, {method:body === undefined ? 'GET' : 'POST',headers,body:body === undefined ? undefined : JSON.stringify(body)}),env,waitUntil:p => pending.push(p)});
  await Promise.all(pending);
  return {status:response.status,data:await response.json(),cookie:response.headers.get('Set-Cookie')?.split(';')[0]};
}
let session = 0;
const calls = [];
globalThis.fetch = async (url, options) => {
  const body = JSON.parse(options.body); calls.push({url:String(url),body});
  if (url.endsWith('/sessions/new')) return Response.json({sessionId:'session-' + ++session});
  if (url.endsWith('/tracks/new')) {
    const local = body.tracks[0].location === 'local';
    return Response.json({sessionDescription:{type:local ? 'answer' : 'offer',sdp:video(local ? 'recvonly' : 'sendonly')},tracks:[{mid:'0'}],requiresImmediateRenegotiation:!local});
  }
  return Response.json({});
};
async function login(env) { const r = await call(env,'auth',{passcode:'test-passcode'}); assert.equal(r.status,200); return r.cookie; }
const publish = (env,cookie) => call(env,'publish',{sdp:video('sendonly'),mid:'0'},cookie);

test('missing bindings are named, with no secret values returned',async () => {
  assert.deepEqual((await call({},'health')).data.missing,['CF_REALTIME_APP_ID','CF_REALTIME_APP_SECRET','LIVE_TEACHER_PASSCODE','LIVE_DB']);
  assert.equal((await call({},'publish',{})).status,503);
});
test('authentication, cross-origin rejection and login rate limits',async () => {
  const env = environment();
  assert.equal((await publish(env,'')).status,401);
  assert.equal((await call(env,'auth',{passcode:'test-passcode'},'','https://other.example')).status,403);
  for (let i = 0; i < 10; i++) assert.equal((await call(env,'auth',{passcode:'wrong'})).status,401);
  assert.equal((await call(env,'auth',{passcode:'wrong'})).status,429);
});
test('publish, activate, receive, and stop obey role boundaries',async () => {
  const env = environment(), cookie = await login(env), p = await publish(env,cookie);
  assert.equal(p.status,200);
  assert.equal((await call(env,'status')).data.live,false);
  assert.equal((await publish(env,cookie)).status,409);
  assert.equal((await call(env,'watch',{})).status,409);
  assert.equal((await call(env,'activate',{token:p.data.token})).status,200);
  assert.equal((await call(env,'status')).data.live,true);
  const w = await call(env,'watch',{}); assert.equal(w.status,200);
  assert.equal(w.data.sessionDescription.type,'offer');
  assert.equal((await call(env,'activate',{token:w.data.token})).status,401);
  assert.equal((await call(env,'stop',{token:w.data.token})).status,401);
  assert.equal((await call(env,'answer',{token:w.data.token,sdp:video('sendonly')})).status,400);
  assert.equal((await call(env,'answer',{token:w.data.token,sdp:video('recvonly')})).status,200);
  assert.equal((await call(env,'answer',{token:p.data.token,sdp:video('recvonly')})).status,401);
  assert.equal((await call(env,'stop',{token:p.data.token})).status,200);
  assert.equal((await call(env,'status')).data.live,false);
  assert.equal((await call(env,'watch',{})).status,409);
  assert.equal((await call(env,'heartbeat',{token:p.data.token})).status,409);
  assert(calls.some(c => c.url.endsWith('/tracks/close') && c.body.force));
});
test('expired sessions cannot renew; an old stop cannot clear a new broadcast',async () => {
  const env = environment(),cookie = await login(env),old = await publish(env,cookie);
  await call(env,'activate',{token:old.data.token});
  await env.LIVE_DB.prepare('UPDATE live_rooms SET expires=0').run();
  assert.equal((await call(env,'status')).data.live,false);
  assert.equal((await call(env,'heartbeat',{token:old.data.token})).status,409);
  const newer = await publish(env,cookie); assert.equal(newer.status,200);
  await call(env,'activate',{token:newer.data.token});
  await call(env,'stop',{token:old.data.token});
  assert.equal((await call(env,'status')).data.live,true);
});
test('preview cannot control production with shared database and secrets',async () => {
  const env = environment(),cookie = await login(env),p = await publish(env,cookie);
  await call(env,'activate',{token:p.data.token});
  const preview = {...env,CF_PAGES_BRANCH:'preview-test'};
  assert.equal((await call(preview,'status')).data.live,false);
  assert.equal((await call(preview,'stop',{token:p.data.token})).status,401);
});
test('reject extra audio tracks, duplex senders, arbitrary proxy routes and forged tokens',async () => {
  const env = environment(),cookie = await login(env);
  assert.equal((await call(env,'publish',{sdp:video('sendonly')+'m=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=sendonly\r\n',mid:'0'},cookie)).status,400);
  assert.equal((await call(env,'publish',{sdp:video('sendrecv'),mid:'0'},cookie)).status,400);
  assert.equal((await call(env,'sessions/other/tracks/new',{},cookie)).status,404);
  assert.equal((await call(env,'stop',{token:'forged.token'})).status,401);
});
test('upstream failure releases the pending broadcast for retry',async () => {
  const env = environment(),cookie = await login(env),normal = globalThis.fetch;
  globalThis.fetch = async () => Response.json({errorCode:'bad'},{status:401});
  try { assert.equal((await publish(env,cookie)).status,502); } finally { globalThis.fetch = normal; }
  assert.equal((await publish(env,cookie)).status,200);
});
