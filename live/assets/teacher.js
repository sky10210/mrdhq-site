import {api,peer,iceReady,connected,beacon} from './connection.js';
const $=id=>document.getElementById(id);
const select=$('cameraSelect'), preview=$('preview'), status=$('cameraStatus');
let stream=null,pc=null,token=null,heartbeat=null,attempt=0,busy=false,lastHeartbeat=0,unlocked=false;
const say=message=>{status.textContent=message;};
function controls(){
  $('startBtn').disabled=busy||!!token||!unlocked;
  $('goLiveBtn').disabled=busy||!!token||!stream||!unlocked;
  $('stopLiveBtn').disabled=!token&&!busy;
  $('stopBtn').disabled=!stream&&!busy;
  select.disabled=busy||!!token;
}
async function setup(){
  try{
    const health=await api('health');
    if(!health.configured){$('gateError').textContent='Setup needed: '+health.missing.join(', ')+'. Add these bindings to this Cloudflare Pages project, then redeploy.';return;}
    $('gateError').textContent='';
    await api('auth');
    unlocked=true;$('teacherGate').classList.add('hidden');controls();await listCameras();
  }catch(e){if(e.status!==401)$('gateError').textContent=e.message;}
}
async function unlock(){
  $('unlockTeacher').disabled=true;
  try{
    await api('auth',{passcode:$('teacherPasscode').value});
    $('teacherPasscode').value='';unlocked=true;$('teacherGate').classList.add('hidden');controls();await listCameras();
  }catch(e){$('gateError').textContent=e.message;}
  finally{$('unlockTeacher').disabled=false;}
}
async function listCameras(){
  try{
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera access needs a supported browser and an HTTPS address.');
    const selected=select.value, devices=await navigator.mediaDevices.enumerateDevices();
    select.replaceChildren();
    devices.filter(d=>d.kind==='videoinput').forEach((d,i)=>select.add(new Option(d.label||`Camera ${i+1}`,d.deviceId)));
    if(!select.length)select.add(new Option('No cameras found',''));
    if([...select.options].some(o=>o.value===selected))select.value=selected;
  }catch(e){say(e.message);}
}
function releaseCamera(){
  if(stream)stream.getTracks().forEach(track=>track.stop());
  stream=null;preview.srcObject=null;preview.style.display='none';$('empty').style.display='block';
}
async function stopLive(message='Broadcast stopped. Camera preview is private.'){
  attempt++;busy=false;clearTimeout(heartbeat);heartbeat=null;
  const old=token;token=null;const oldPC=pc;pc=null;oldPC?.close();
  say(message);controls();
  if(old)try{await api('stop',{token:old});}catch{beacon('stop',old);say(message+' Students may take a moment to see the offline message.');}
}
async function startCamera(){
  if(busy||token)return;
  busy=true;controls();releaseCamera();say('Allow camera access in your browser.');
  const id=++attempt;
  try{
    const options={width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:15,max:24}};
    if(select.value)options.deviceId={exact:select.value};
    const camera=await navigator.mediaDevices.getUserMedia({video:options,audio:false});
    if(id!==attempt){camera.getTracks().forEach(t=>t.stop());return;}
    stream=camera;preview.srcObject=stream;preview.style.display='block';$('empty').style.display='none';await preview.play();
    const track=stream.getVideoTracks()[0];track.contentHint='detail';
    track.addEventListener('ended',()=>{stopLive('Camera disconnected. Reconnect it, then start the camera.');releaseCamera();controls();});
    await listCameras();if(track.getSettings().deviceId)select.value=track.getSettings().deviceId;
    say('Private preview: '+(track.label||'Camera')+'. Press Go Live when ready.');
  }catch(e){
    if(id===attempt){releaseCamera();say(e.name==='NotAllowedError'?'Camera permission was denied. Allow camera access in your browser and retry.':e.name==='NotReadableError'?'The camera is busy. Close other apps using it and retry.':e.message);}
  }finally{if(id===attempt){busy=false;controls();}}
}
async function beat(id){
  if(id!==attempt||!token)return;
  if(pc?.connectionState!=='connected'){
    if(Date.now()-lastHeartbeat>60000){await stopLive('Video connection lost. Press Go Live to reconnect.');return;}
    heartbeat=setTimeout(()=>beat(id),5000);return;
  }
  try{await api('heartbeat',{token});lastHeartbeat=Date.now();say('LIVE — students can now see your camera. Keep this tab open.');}
  catch(e){
    if(e.status===409||e.status===401||Date.now()-lastHeartbeat>60000){await stopLive(e.message);return;}
    say('Broadcast connection interrupted. Reconnecting...');
  }
  if(id===attempt)heartbeat=setTimeout(()=>beat(id),15000);
}
async function goLive(){
  if(!stream||busy||token)return;
  busy=true;controls();const id=++attempt;
  try{
    say('Connecting the camera to the classroom...');
    const activePC=peer();pc=activePC;
    const track=stream.getVideoTracks()[0];
    const transceiver=activePC.addTransceiver(track,{direction:'sendonly',streams:[stream],sendEncodings:[{maxBitrate:2500000,maxFramerate:15}]});
    await activePC.setLocalDescription(await activePC.createOffer());await iceReady(activePC);
    if(id!==attempt)return;
    const published=await api('publish',{sdp:activePC.localDescription.sdp,mid:transceiver.mid});
    if(id!==attempt){beacon('stop',published.token);return;}
    token=published.token;await activePC.setRemoteDescription(published.sessionDescription);await connected(activePC);
    if(id!==attempt)return;
    await api('activate',{token});if(id!==attempt)return;
    lastHeartbeat=Date.now();say('LIVE — students can now see your camera. Keep this tab open.');
    heartbeat=setTimeout(()=>beat(id),15000);
    activePC.addEventListener('connectionstatechange',()=>{
      if(id!==attempt)return;
      if(activePC.connectionState==='failed')stopLive('Video connection lost. Press Go Live to reconnect.');
      else if(activePC.connectionState==='disconnected')say('Video connection interrupted. Reconnecting...');
      else if(activePC.connectionState==='connected')say('LIVE — students can now see your camera. Keep this tab open.');
    });
  }catch(e){
    if(id===attempt){await stopLive(e.message);if(e.status===401){unlocked=false;$('teacherGate').classList.remove('hidden');}}
  }finally{if(id===attempt){busy=false;controls();}}
}
$('unlockTeacher').addEventListener('click',unlock);
$('teacherPasscode').addEventListener('keydown',e=>{if(e.key==='Enter')unlock();});
$('startBtn').addEventListener('click',startCamera);
$('goLiveBtn').addEventListener('click',goLive);
$('stopLiveBtn').addEventListener('click',()=>stopLive());
$('stopBtn').addEventListener('click',()=>{stopLive('Camera and broadcast stopped.');releaseCamera();controls();});
$('refreshBtn').addEventListener('click',listCameras);
$('checkSetupBtn').addEventListener('click',setup);
$('viewerLink').textContent=location.host+'/live/';
$('copyLinkBtn').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(location.origin+'/live/');$('copyLinkBtn').textContent='Link copied';setTimeout(()=>$('copyLinkBtn').textContent='Copy Student Link',2000);}catch{say('Student link: '+location.origin+'/live/');}
});
navigator.mediaDevices?.addEventListener?.('devicechange',listCameras);
window.addEventListener('pagehide',()=>{beacon('stop',token);attempt++;clearTimeout(heartbeat);token=null;pc?.close();pc=null;releaseCamera();busy=false;controls();});
window.addEventListener('pageshow',e=>{if(e.persisted){say('Camera stopped. Start it again when ready.');setup();}});
controls();setup();$('teacherPasscode').focus();
