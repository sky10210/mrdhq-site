// MRDHQ Opening Bell + Class Discussion collector
// Attach this script to: MRDHQ Opening Bell Responses 2026-27
// Deploy as Web App: Execute as Me | Who has access: Anyone

function doGet(e) {
  try {
    var p = e && e.parameter ? e.parameter : {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = clean_(p.action || '');

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
  if(action==='discussionList') return discussionList_(sh,cls,clean_(p.block||''));
  if(action==='discussionPost') return discussionPost_(sh,cls,p);
  if(action==='discussionReply') return discussionReply_(sh,cls,p);
  if(action==='discussionAgree') return discussionAgree_(sh,cls,clean_(p.id||''));
  return json_({success:false,error:'Unknown discussion action'});
}

function getOrCreateDiscussionSheet_(ss){
  var sh=ss.getSheetByName('Discussion');
  if(!sh){
    sh=ss.insertSheet('Discussion');
    sh.appendRow(['Timestamp','ID','Parent ID','Class','Block','First Name','Last Name','Public Name','Stance','Prompt','Response','Agrees','Hidden']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function discussionPost_(sh,cls,p){
  var first=clean_(p.firstName||''),last=clean_(p.lastName||''),block=clean_(p.block||''),response=clean_(p.response||'');
  if(!first||!last||!block||!response) return json_({success:false,error:'Missing required fields'});
  if(response.length>1500) response=response.substring(0,1500);
  var id=Utilities.getUuid(),display=first+' '+last.charAt(0).toUpperCase()+'.';
  sh.appendRow([new Date(),id,'',cls,block,first,last,display,clean_(p.stance||''),clean_(p.prompt||''),response,0,false]);
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

function discussionList_(sh,cls,block){
  var vals=sh.getDataRange().getValues(),parents=[],replies={};
  for(var i=1;i<vals.length;i++){
    var r=vals[i]; if(r[3]!==cls || String(r[12]).toLowerCase()==='true') continue;
    var obj={id:String(r[1]),parentId:String(r[2]||''),block:String(r[4]),displayName:String(r[7]),stance:String(r[8]||''),response:String(r[10]||''),agrees:Number(r[11]||0),time:Utilities.formatDate(new Date(r[0]),Session.getScriptTimeZone()||'America/New_York','MMM d, h:mm a')};
    if(obj.parentId){if(!replies[obj.parentId])replies[obj.parentId]=[];replies[obj.parentId].push(obj)}
    else if(!block||obj.block===block) parents.push(obj);
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
