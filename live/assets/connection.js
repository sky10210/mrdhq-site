export async function api(action,body,options={}) {
  const response=await fetch('/api/live/'+action,{
    method:body===undefined?'GET':'POST', credentials:'same-origin',cache:'no-store',
    headers:body===undefined?{}:{'Content-Type':'application/json'},
    body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(25000),...options
  });
  const data=await response.json().catch(()=>({error:'The live backend is not deployed on this address yet.'}));
  if(!response.ok || data.error){const error=new Error(data.error||'Connection unavailable.');error.status=response.status;throw error;}
  return data;
}
export function peer() {
  return new RTCPeerConnection({iceServers:[{urls:'stun:stun.cloudflare.com:3478'}],bundlePolicy:'max-bundle'});
}
export function iceReady(pc) {
  if(pc.iceGatheringState==='complete') return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const done=()=>{clearTimeout(timer);pc.removeEventListener('icegatheringstatechange',check);};
    const check=()=>{if(pc.iceGatheringState==='complete'){done();resolve();}};
    const timer=setTimeout(()=>{done();reject(new Error('Camera connection timed out. Check your network and retry.'));},12000);
    pc.addEventListener('icegatheringstatechange',check);check();
  });
}
export function connected(pc) {
  return new Promise((resolve,reject)=>{
    const cleanup=()=>{clearTimeout(timer);pc.removeEventListener('connectionstatechange',check);};
    const check=()=>{
      if(pc.connectionState==='connected'){cleanup();resolve();}
      if(['failed','closed'].includes(pc.connectionState)){cleanup();reject(new Error('Video could not connect on this network. Try another connection or ask school IT to allow Cloudflare Realtime.'));}
    };
    const timer=setTimeout(()=>{cleanup();reject(new Error('Video could not connect on this network. Try another connection or ask school IT to allow Cloudflare Realtime.'));},20000);
    pc.addEventListener('connectionstatechange',check);check();
  });
}
export function beacon(action,token){
  if(token) navigator.sendBeacon('/api/live/'+action,new Blob([JSON.stringify({token})],{type:'application/json'}));
}
