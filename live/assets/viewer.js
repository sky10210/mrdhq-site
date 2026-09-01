import {api,peer,iceReady,connected,beacon} from './connection.js';
const $=id=>document.getElementById(id),video=$('remoteVideo');
let pc=null,token=null,version=null,timer=null,active=true;
function message(title,detail,label='Offline'){
  $('status').classList.remove('live');$('statusText').textContent=label;
  $('offline').style.display='block';$('offlineTitle').textContent=title;$('offlineDetail').textContent=detail;
  video.style.display='none';$('playBtn').hidden=true;
}
function close(){
  if(token)beacon('leave',token);token=null;version=null;
  const old=pc;pc=null;old?.close();video.srcObject=null;
}
async function play(){
  video.style.display='block';
  try{await video.play();$('offline').style.display='none';$('playBtn').hidden=true;}
  catch{$('playBtn').hidden=false;$('offline').style.display='none';$('statusText').textContent='Tap to watch';}
}
video.addEventListener('playing',()=>{$('status').classList.add('live');$('statusText').textContent='LIVE';});
$('playBtn').addEventListener('click',play);
async function watch(){
  close();message('Connecting to the camera...','Your camera and microphone stay off.','Connecting');
  const currentPC=peer();pc=currentPC;
  const media=new MediaStream();video.srcObject=media;
  currentPC.addEventListener('track',event=>{
    if(pc!==currentPC)return;media.addTrack(event.track);
    event.track.addEventListener('ended',()=>{if(pc===currentPC){close();message('Camera disconnected.','Reconnecting automatically...','Reconnecting');}});
  });
  const data=await api('watch',{});
  if(pc!==currentPC){beacon('leave',data.token);return;}
  token=data.token;version=data.version;
  await currentPC.setRemoteDescription(data.sessionDescription);
  currentPC.getTransceivers().forEach(t=>t.direction='recvonly');
  await currentPC.setLocalDescription(await currentPC.createAnswer());await iceReady(currentPC);
  if(pc!==currentPC)return;
  await api('answer',{token,sdp:currentPC.localDescription.sdp});await connected(currentPC);
  if(pc!==currentPC)return;
  await play();
  currentPC.addEventListener('connectionstatechange',()=>{
    if(pc!==currentPC)return;
    if(['failed','disconnected'].includes(currentPC.connectionState)){close();message('Connection interrupted.','Reconnecting automatically...','Reconnecting');}
  });
}
async function poll(){
  if(!active)return;
  try{
    const state=await api('status');
    if(!active)return;
    if(!state.live){close();message('No live classroom feed right now.','Keep this page open. The camera will appear when Mr. D goes live.');}
    else if(!pc||version!==state.version)await watch();
  }catch(e){close();message('Live view is unavailable.',e.message,'Reconnecting');}
  finally{if(active)timer=setTimeout(poll,5000);}
}
$('fullscreenBtn').addEventListener('click',async()=>{
  try{
    if(document.fullscreenElement)await document.exitFullscreen();
    else if($('frame').requestFullscreen)await $('frame').requestFullscreen();
    else if(video.webkitEnterFullscreen&&video.srcObject)video.webkitEnterFullscreen();
    else document.body.classList.toggle('expanded');
  }catch{document.body.classList.toggle('expanded');}
});
window.addEventListener('pagehide',()=>{active=false;clearTimeout(timer);close();});
window.addEventListener('pageshow',e=>{if(e.persisted){active=true;poll();}});
poll();
