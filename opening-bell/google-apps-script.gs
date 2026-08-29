// MRDHQ Opening Bell + Class Discussion collector
// Attach this script to: MRDHQ Opening Bell Responses 2026-27
// Deploy as Web App: Execute as Me | Who has access: Anyone

function doGet(e) { return handleRequest_(e); }
function doPost(e) { return handleRequest_(e); }

function handleRequest_(e) {
  try {
    var p = e && e.parameter ? e.parameter : {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = clean_(p.action || '');
    if (action.indexOf('openingBell') === 0) return handleOpeningBell_(ss, p, action);

    if (action.indexOf('discussion') === 0) return handleDiscussion_(ss, p, action);

    var master = getOrCreateResponseSheet_(ss, 'Responses');
    var ts = parseTimestamp_(p.timestamp);
    var className = normalizeClass_(clean_(p.cls || p.className || ''));
    var block = clean_(p.block || p.period || '');
    var firstName = clean_(p.firstName || p.first || '');
    var lastName = clean_(p.lastName || p.last || '');
    if ((!firstName || !lastName) && (p.name || p.student)) {
      var legacy = clean_(p.name || p.student).split(/\s+/);
      if (!firstName) firstName = legacy.shift() || '';
      if (!lastName) lastName = legacy.join(' ');
    }
    var bellId = clean_(p.qid || (p.bellId ? 'BELL-' + p.bellId : ''));
    var question = clean_(p.question || p.label || '');
    var answer = clean_(p.answer || p.response || '');
    var duration = clean_(p.duration || '');
    var status = normalizeStatus_(p);
    master.appendRow([ts,formatDate_(ts),className,block,firstName,lastName,bellId,question,answer,status,duration ? duration + (String(duration).toLowerCase().indexOf('min') >= 0 ? '' : ' min') : '']);
    ensureClassView_(ss, className);
    return json_({success:true,status:status});
  } catch (err) { return json_({success:false,error:String(err)}); }
}

function handleDiscussion_(ss,p,action){
  var sh=getOrCreateDiscussionSheet_(ss);
  var cls=normalizeClass_(clean_(p.className||p.cls||''));
  if(['AP Business','Marketing','Business 101','Personal Finance'].indexOf(cls)===-1) return json_({success:false,error:'Invalid class'});
  if(action==='discussionList') return discussionList_(sh,cls,clean_(p.block||''),clean_(p.discussionId||''),clean_(p.prompt||''));
  if(action==='discussionPost') return discussionPost_(sh,cls,p);
  if(action==='discussionReply') return discussionReply_(sh,cls,p);
  if(action==='discussionAgree') return discussionAgree_(sh,cls,clean_(p.id||''));
  return json_({success:false,error:'Unknown discussion action'});
}

function getOrCreateDiscussionSheet_(ss){
  var sh=ss.getSheetByName('Discussion');
  if(!sh){
    sh=ss.insertSheet('Discussion');
    sh.appendRow(['Timestamp','ID','Parent ID','Class','Block','First Name','Last Name','Public Name','Stance','Prompt','Response','Agrees','Hidden','Discussion ID']);
    sh.setFrozenRows(1);
  }
  if(clean_(sh.getRange(1,14).getValue())!=='Discussion ID') sh.getRange(1,14).setValue('Discussion ID');
  return sh;
}

function discussionPost_(sh,cls,p){
  var first=clean_(p.firstName||''),last=clean_(p.lastName||''),block=clean_(p.block||''),response=clean_(p.response||'');
  if(!first||!last||!block||!response) return json_({success:false,error:'Missing required fields'});
  if(response.length>1500) response=response.substring(0,1500);
  var id=Utilities.getUuid(),display=first+' '+last.charAt(0).toUpperCase()+'.';
  sh.appendRow([new Date(),id,'',cls,block,first,last,display,clean_(p.stance||''),clean_(p.prompt||''),response,0,false,clean_(p.discussionId||'default')]);
  return json_({success:true,id:id});
}

function discussionReply_(sh,cls,p){
  var first=clean_(p.firstName||''),last=clean_(p.lastName||''),block=clean_(p.block||''),response=clean_(p.response||''),parent=clean_(p.parentId||'');
  if(!first||!last||!block||!response||!parent) return json_({success:false,error:'Missing required fields'});
  if(response.length>1000) response=response.substring(0,1000);
  var id=Utilities.getUuid(),display=first+' '+last.charAt(0).toUpperCase()+'.';
  sh.appendRow([new Date(),id,parent,cls,block,first,last,display,'','',response,0,false]);
  return json_({success:true,id:id});
}

function discussionAgree_(sh,cls,id){
  if(!id) return json_({success:false,error:'Missing post ID'});
  var lock=LockService.getScriptLock();lock.waitLock(5000);
  try{
    var vals=sh.getDataRange().getValues();
    for(var i=1;i<vals.length;i++) if(String(vals[i][1])===id && vals[i][3]===cls && !vals[i][2]){
      var n=Number(vals[i][11]||0)+1;sh.getRange(i+1,12).setValue(n);return json_({success:true,agrees:n});
    }
    return json_({success:false,error:'Post not found'});
  }finally{lock.releaseLock();}
}

function discussionList_(sh,cls,block,discussionId,prompt){
  var vals=sh.getDataRange().getValues(),parents=[],replies={};
  for(var i=1;i<vals.length;i++){
    var r=vals[i]; if(r[3]!==cls || String(r[12]).toLowerCase()==='true') continue;
    var obj={id:String(r[1]),parentId:String(r[2]||''),block:String(r[4]),displayName:String(r[7]),stance:String(r[8]||''),prompt:String(r[9]||''),response:String(r[10]||''),agrees:Number(r[11]||0),discussionId:String(r[13]||''),time:Utilities.formatDate(new Date(r[0]),Session.getScriptTimeZone()||'America/New_York','MMM d, h:mm a')};
    if(obj.parentId){if(!replies[obj.parentId])replies[obj.parentId]=[];replies[obj.parentId].push(obj)}
    else {
      var discussionMatch=!discussionId || obj.discussionId===discussionId || (!obj.discussionId && prompt && obj.prompt===prompt);
      if(discussionMatch && (!block||obj.block===block)) parents.push(obj);
    }
  }
  parents.reverse();
  parents.forEach(function(x){x.replies=(replies[x.id]||[]).slice(-20)});
  return json_({success:true,posts:parents.slice(0,100)});
}

function normalizeClass_(value) { if (value === 'Personal Financial Management') return 'Personal Finance'; return value; }
function normalizeStatus_(p) { var raw=String(p.status||'').trim().toLowerCase(),label=String(p.label||'').trim().toLowerCase();var makeup=String(p.makeup||'')==='1'||raw.indexOf('makeup')>=0||label==='makeup';var late=String(p.late||'')==='1'||raw.indexOf('late')>=0;if(makeup)return'Makeup — After Class/Absent';if(late)return'Late — Same Day';return'On Time'; }
function getOrCreateResponseSheet_(ss,name){var sh=ss.getSheetByName(name);if(!sh){sh=ss.insertSheet(name);sh.appendRow(['Timestamp','Date','Class','Block','First Name','Last Name','Question ID','Question','Response','Status','Duration']);sh.setFrozenRows(1)}return sh}
function ensureClassView_(ss,className){if(!className)return;var allowed=['AP Business','Marketing','Business 101','Personal Finance'];if(allowed.indexOf(className)===-1)return;var sh=ss.getSheetByName(className);if(!sh)return}
function parseTimestamp_(value){if(!value)return new Date();var d=new Date(value);return isNaN(d.getTime())?new Date():d}
function formatDate_(d){return Utilities.formatDate(d,Session.getScriptTimeZone()||'America/New_York','M/d/yyyy')}
function clean_(v){return v==null?'':String(v).trim()}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)}


/* Universal authenticated Opening Bell */
var FIREBASE_WEB_API_KEY_ = 'AIzaSyA_R--xQW8CdgbI1HGx5oxbqljHBGCujhY';
var OPENING_BELL_TEACHER_ = 'skyler.dipasquale@casdonline.org';

function handleOpeningBell_(ss,p,action){
  var identity=verifyFirebaseUser_(clean_(p.idToken||''));
  if(!identity) return json_({success:false,error:'Sign in with your school Google account first.'});
  if(action==='openingBellStart') return openingBellStart_(ss,p,identity);
  if(action==='openingBellGet') return openingBellGet_(ss,clean_(p.code||''));
  if(action==='openingBellSubmit') return openingBellSubmit_(ss,p,identity);
  return json_({success:false,error:'Unknown Opening Bell action.'});
}

function verifyFirebaseUser_(idToken){
  if(!idToken) return null;
  try{
    var url='https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+encodeURIComponent(FIREBASE_WEB_API_KEY_);
    var response=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',payload:JSON.stringify({idToken:idToken}),muteHttpExceptions:true});
    if(response.getResponseCode()!==200) return null;
    var data=JSON.parse(response.getContentText()||'{}');
    var u=data.users&&data.users[0];
    if(!u||!u.email) return null;
    return {uid:String(u.localId||''),email:String(u.email||'').toLowerCase(),name:String(u.displayName||'Student')};
  }catch(err){return null}
}

function openingBellSessions_(ss){
  var sh=ss.getSheetByName('Opening Bell Sessions');
  if(!sh){
    sh=ss.insertSheet('Opening Bell Sessions');
    sh.appendRow(['Created At','Code','Opening Bell','Title','Class','Block','Question','Duration Seconds','Starts At','Ends At','Teacher Email','Active']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function openingBellSubmissions_(ss){
  var sh=ss.getSheetByName('Opening Bell Submissions');
  if(!sh){
    sh=ss.insertSheet('Opening Bell Submissions');
    sh.appendRow(['Timestamp','Date','Opening Bell','Title','Class','Block','Question','Gradebook First Name','Gradebook Last Name','Google Name','School Email','Firebase UID','Response','Status','Session Code']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function openingBellStart_(ss,p,identity){
  if(identity.email!==OPENING_BELL_TEACHER_) return json_({success:false,error:'Teacher account required.'});
  var bellNumber=clean_(p.bellNumber||''),title=clean_(p.title||''),className=normalizeClass_(clean_(p.className||'')),block=clean_(p.block||''),question=clean_(p.question||'');
  var duration=Math.max(60,Math.min(3600,Number(p.duration||420)));
  var allowed=['AP Business','Marketing','Business 101','Personal Finance'];
  if(!bellNumber||!title||!question||!block||allowed.indexOf(className)===-1) return json_({success:false,error:'Complete every Opening Bell field.'});
  var code=createOpeningBellCode_(),now=new Date(),ends=new Date(now.getTime()+duration*1000);
  openingBellSessions_(ss).appendRow([now,code,bellNumber,title,className,block,question,duration,now,ends,identity.email,true]);
  return json_({success:true,session:{code:code,bellNumber:bellNumber,title:title,className:className,block:block,question:question,duration:duration,startsAt:now.getTime(),endsAt:ends.getTime()}});
}

function createOpeningBellCode_(){
  var chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',out='';
  for(var i=0;i<5;i++) out+=chars.charAt(Math.floor(Math.random()*chars.length));
  return out;
}

function findOpeningBell_(ss,code){
  if(!code) return null;
  var sh=openingBellSessions_(ss),values=sh.getDataRange().getValues();
  for(var i=values.length-1;i>0;i--){
    var r=values[i];
    if(String(r[1]).toUpperCase()===String(code).toUpperCase() && String(r[11]).toLowerCase()!=='false'){
      return {row:i+1,code:String(r[1]),bellNumber:String(r[2]),title:String(r[3]),className:String(r[4]),block:String(r[5]),question:String(r[6]),duration:Number(r[7]),startsAt:new Date(r[8]).getTime(),endsAt:new Date(r[9]).getTime()};
    }
  }
  return null;
}

function openingBellGet_(ss,code){
  var session=findOpeningBell_(ss,code);
  if(!session) return json_({success:false,error:'That session code was not found.'});
  if(Date.now()>session.endsAt+24*60*60*1000) return json_({success:false,error:'That Opening Bell session has expired.'});
  delete session.row;
  return json_({success:true,session:session});
}

function rosterIdentity_(ss,identity,className,block){
  var first='',last='',sh=ss.getSheetByName('Roster');
  if(sh){
    var values=sh.getDataRange().getValues();
    for(var i=1;i<values.length;i++){
      if(String(values[i][0]||'').trim().toLowerCase()===identity.email){
        first=clean_(values[i][1]||'');last=clean_(values[i][2]||'');break;
      }
    }
  }
  if(!first&&!last){
    var parts=String(identity.name||'Student').trim().split(/\s+/);
    first=parts.shift()||'Student';last=parts.join(' ');
  }
  return {first:first,last:last};
}

function openingBellSubmit_(ss,p,identity){
  var session=findOpeningBell_(ss,clean_(p.code||''));
  if(!session) return json_({success:false,error:'Opening Bell session not found.'});
  var answer=clean_(p.answer||'');
  if(answer.length<8) return json_({success:false,error:'Write a more complete response.'});
  var sh=openingBellSubmissions_(ss),values=sh.getDataRange().getValues();
  for(var i=values.length-1;i>0;i--){
    if(String(values[i][10]||'').toLowerCase()===identity.email && String(values[i][14]||'').toUpperCase()===session.code) return json_({success:false,error:'You already submitted this Opening Bell.'});
  }
  var official=rosterIdentity_(ss,identity,session.className,session.block);
  var now=new Date(),status=Date.now()>session.endsAt?'Late':'On Time';
  sh.appendRow([now,formatDate_(now),session.bellNumber,session.title,session.className,session.block,session.question,official.first,official.last,identity.name,identity.email,identity.uid,answer,status,session.code]);
  return json_({success:true,status:status});
}
