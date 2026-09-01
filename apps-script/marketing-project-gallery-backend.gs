const GALLERY_SHEET_ID = '1K2oqK982q5TgR07AGjQ_GP3UQB5pvjmQEPBrvtymF7Y';
const GALLERY_ROOT_FOLDER_ID = '1IamflFbg7PijoznNNqeumD3hdsd8fZ4V';

function doGet(e) {
  return routeGallery_(e && e.parameter ? e.parameter : {});
}

function doPost(e) {
  const p = Object.assign({}, e && e.parameter ? e.parameter : {});
  if (e && e.postData && e.postData.contents && e.postData.type === 'application/json') {
    try { Object.assign(p, JSON.parse(e.postData.contents)); } catch (err) {}
  }
  return routeGallery_(p);
}

function routeGallery_(p) {
  try {
    const action = String(p.action || 'state');
    if (action === 'state') return jsonGallery_(galleryState_(p));
    if (action === 'submit') return jsonGallery_(submitGallery_(p));
    if (action === 'vote') return jsonGallery_(voteGallery_(p));
    if (action === 'comment') return jsonGallery_(commentGallery_(p));
    if (action === 'adminState') return jsonGallery_(adminStateGallery_(p));
    if (action === 'saveProject') return jsonGallery_(saveProjectGallery_(p));
    if (action === 'setSubmission') return jsonGallery_(setSubmissionGallery_(p));
    if (action === 'setComment') return jsonGallery_(setCommentGallery_(p));
    return jsonGallery_({success:false,error:'Unknown action'});
  } catch (err) {
    return jsonGallery_({success:false,error:String(err && err.message ? err.message : err)});
  }
}

function ssGallery_(){ return SpreadsheetApp.openById(GALLERY_SHEET_ID); }
function sheetGallery_(name){ const sh=ssGallery_().getSheetByName(name); if(!sh) throw new Error('Missing sheet: '+name); return sh; }
function jsonGallery_(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function cleanGallery_(v){ return String(v == null ? '' : v).trim(); }
function boolGallery_(v, d){ if(v===true||String(v).toLowerCase()==='true'||String(v)==='1') return true; if(v===false||String(v).toLowerCase()==='false'||String(v)==='0') return false; return !!d; }
function identityGallery_(first,last,block){ return [first,last,block].map(x=>cleanGallery_(x).toLowerCase().replace(/\s+/g,' ')).join('|'); }
function tokenGallery_(s){ const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8); return bytes.map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join(''); }
function nowGallery_(){ return new Date(); }
function teacherOKGallery_(p){ const key=PropertiesService.getScriptProperties().getProperty('TEACHER_KEY'); return !!key && cleanGallery_(p.teacherKey)===key; }
function rowsGallery_(name){ const sh=sheetGallery_(name), vals=sh.getDataRange().getValues(); if(vals.length<2) return []; const h=vals[0]; return vals.slice(1).filter(r=>r.some(v=>v!==''&&v!=null)).map((r,i)=>{const o={_row:i+2};h.forEach((k,j)=>o[k]=r[j]);return o;}); }
function projectGallery_(id){ return rowsGallery_('Projects').find(r=>cleanGallery_(r['Project ID'])===cleanGallery_(id)); }
function activeProjectsGallery_(){ return rowsGallery_('Projects').filter(r=>!['archived'].includes(cleanGallery_(r.Status).toLowerCase())); }

function galleryState_(p){
  const projects=activeProjectsGallery_();
  const projectId=cleanGallery_(p.projectId) || (projects[0] ? cleanGallery_(projects[0]['Project ID']) : '');
  const project=projects.find(r=>cleanGallery_(r['Project ID'])===projectId) || null;
  if(!project) return {success:true,project:null,projects:[]};
  const subs=rowsGallery_('Submissions').filter(r=>cleanGallery_(r['Project ID'])===projectId && !boolGallery_(r.Hidden,false));
  const votes=rowsGallery_('Votes').filter(r=>cleanGallery_(r['Project ID'])===projectId);
  const comments=rowsGallery_('Comments').filter(r=>cleanGallery_(r['Project ID'])===projectId && boolGallery_(r.Approved,false) && !boolGallery_(r.Hidden,false));
  const counts={}; votes.forEach(v=>counts[cleanGallery_(v['Submission ID'])]=(counts[cleanGallery_(v['Submission ID'])]||0)+1);
  const commentMap={}; comments.forEach(c=>{const id=cleanGallery_(c['Submission ID']);(commentMap[id]||(commentMap[id]=[])).push({first:cleanGallery_(c['First Name']),comment:cleanGallery_(c.Comment),createdAt:c['Created At']});});
  let entries=subs.map(s=>({id:cleanGallery_(s['Submission ID']),entryNumber:Number(s['Entry Number'])||0,caption:cleanGallery_(s.Caption),imageUrl:cleanGallery_(s['Image URL']),late:boolGallery_(s.Late,false),eligible:boolGallery_(s['Eligible For Voting'],true),ownerToken:tokenGallery_(cleanGallery_(s['Identity Key'])),votes:counts[cleanGallery_(s['Submission ID'])]||0,comments:commentMap[cleanGallery_(s['Submission ID'])]||[],name:boolGallery_(project['Anonymous Voting'],true)?'':(cleanGallery_(s['First Name'])+' '+cleanGallery_(s['Last Name'])).trim()}));
  if(boolGallery_(project['Reveal Results'],false)) entries.sort((a,b)=>b.votes-a.votes||a.entryNumber-b.entryNumber); else entries.sort((a,b)=>a.entryNumber-b.entryNumber);
  return {success:true,project:publicProjectGallery_(project),projects:projects.map(publicProjectGallery_),entries:entries,totalVotes:votes.length};
}

function publicProjectGallery_(r){ return {id:cleanGallery_(r['Project ID']),title:cleanGallery_(r.Title),directions:cleanGallery_(r.Directions),block:cleanGallery_(r.Block)||'All',status:cleanGallery_(r.Status)||'submissions',submissionDeadline:r['Submission Deadline']||'',votingDeadline:r['Voting Deadline']||'',maxVotes:Number(r['Max Votes Per Student'])||1,commentsEnabled:boolGallery_(r['Comments Enabled'],false),anonymousVoting:boolGallery_(r['Anonymous Voting'],true),allowLate:boolGallery_(r['Allow Late Submissions'],false),lateEligible:boolGallery_(r['Late Eligible For Voting'],false),revealResults:boolGallery_(r['Reveal Results'],false)}; }

function submitGallery_(p){
  const project=projectGallery_(p.projectId); if(!project) throw new Error('Project not found.');
  const status=cleanGallery_(project.Status).toLowerCase();
  const allowLate=boolGallery_(project['Allow Late Submissions'],false);
  const late=status!=='submissions';
  if(late && !allowLate) throw new Error('Submissions are closed.');
  const first=cleanGallery_(p.firstName), last=cleanGallery_(p.lastName), block=cleanGallery_(p.block); if(!first||!last||!block) throw new Error('Name and block are required.');
  const imageData=cleanGallery_(p.imageData), imageType=cleanGallery_(p.imageType)||'image/jpeg'; if(!imageData) throw new Error('Please attach an image.');
  const bytes=Utilities.base64Decode(imageData.replace(/^data:[^;]+;base64,/,'')); if(bytes.length>6*1024*1024) throw new Error('Image is too large.');
  const projectId=cleanGallery_(project['Project ID']); const identity=identityGallery_(first,last,block);
  const existing=rowsGallery_('Submissions').find(r=>cleanGallery_(r['Project ID'])===projectId && cleanGallery_(r['Identity Key'])===identity && !boolGallery_(r.Hidden,false)); if(existing) throw new Error('You already submitted to this project.');
  let folderId=cleanGallery_(project['Drive Folder ID']);
  if(!folderId){ const folder=DriveApp.getFolderById(GALLERY_ROOT_FOLDER_ID).createFolder(cleanGallery_(project.Title)||projectId); folderId=folder.getId(); sheetGallery_('Projects').getRange(project._row,14).setValue(folderId); }
  const entryNo=rowsGallery_('Submissions').filter(r=>cleanGallery_(r['Project ID'])===projectId).length+1;
  const ext=imageType.indexOf('png')>-1?'png':'jpg'; const blob=Utilities.newBlob(bytes,imageType,'entry-'+entryNo+'-'+Date.now()+'.'+ext); const file=DriveApp.getFolderById(folderId).createFile(blob);
  try{ file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW); }catch(err){}
  const url='https://drive.google.com/uc?export=view&id='+file.getId(); const id=Utilities.getUuid();
  sheetGallery_('Submissions').appendRow([id,projectId,first,last,block,identity,entryNo,cleanGallery_(p.caption),file.getId(),url,nowGallery_(),late,late?boolGallery_(project['Late Eligible For Voting'],false):true,false,'']);
  return {success:true,submissionId:id,entryNumber:entryNo,late:late};
}

function voteGallery_(p){
  const project=projectGallery_(p.projectId); if(!project) throw new Error('Project not found.'); if(cleanGallery_(project.Status).toLowerCase()!=='voting') throw new Error('Voting is not open.');
  const first=cleanGallery_(p.firstName),last=cleanGallery_(p.lastName),block=cleanGallery_(p.block), identity=identityGallery_(first,last,block); if(!first||!last||!block) throw new Error('Name and block are required.');
  const sub=rowsGallery_('Submissions').find(r=>cleanGallery_(r['Submission ID'])===cleanGallery_(p.submissionId)&&cleanGallery_(r['Project ID'])===cleanGallery_(p.projectId)); if(!sub||boolGallery_(sub.Hidden,false)||!boolGallery_(sub['Eligible For Voting'],true)) throw new Error('That entry is not eligible for voting.');
  if(cleanGallery_(sub['Identity Key'])===identity) throw new Error('You cannot vote for your own entry.');
  const votes=rowsGallery_('Votes').filter(r=>cleanGallery_(r['Project ID'])===cleanGallery_(p.projectId)&&cleanGallery_(r['Voter Identity Key'])===identity);
  if(votes.some(v=>cleanGallery_(v['Submission ID'])===cleanGallery_(p.submissionId))) throw new Error('You already voted for this entry.');
  const max=Math.max(1,Number(project['Max Votes Per Student'])||1); if(votes.length>=max) throw new Error('You have used all '+max+' of your votes.');
  sheetGallery_('Votes').appendRow([Utilities.getUuid(),cleanGallery_(p.projectId),cleanGallery_(p.submissionId),first,last,block,identity,nowGallery_()]); return {success:true,used:votes.length+1,max:max};
}

function commentGallery_(p){
  const project=projectGallery_(p.projectId); if(!project||!boolGallery_(project['Comments Enabled'],false)) throw new Error('Comments are not open.');
  const first=cleanGallery_(p.firstName),last=cleanGallery_(p.lastName),block=cleanGallery_(p.block),text=cleanGallery_(p.comment); if(!first||!last||!block||!text) throw new Error('Name, block, and comment are required.'); if(text.length>400) throw new Error('Comment is too long.');
  const approval=PropertiesService.getScriptProperties().getProperty('COMMENTS_REQUIRE_APPROVAL')!=='false';
  sheetGallery_('Comments').appendRow([Utilities.getUuid(),cleanGallery_(p.projectId),cleanGallery_(p.submissionId),first,last,block,identityGallery_(first,last,block),text,nowGallery_(),!approval,false]); return {success:true,pending:approval};
}

function adminStateGallery_(p){ if(!teacherOKGallery_(p)) throw new Error('Teacher key is not valid.'); return {success:true,projects:rowsGallery_('Projects'),submissions:rowsGallery_('Submissions'),votes:rowsGallery_('Votes'),comments:rowsGallery_('Comments')}; }

function saveProjectGallery_(p){
  if(!teacherOKGallery_(p)) throw new Error('Teacher key is not valid.');
  const sh=sheetGallery_('Projects'), id=cleanGallery_(p.projectId)||('mkt-'+Date.now()); const existing=projectGallery_(id); const row=[id,cleanGallery_(p.title),cleanGallery_(p.directions),cleanGallery_(p.block)||'All',cleanGallery_(p.status)||'submissions',cleanGallery_(p.submissionDeadline),cleanGallery_(p.votingDeadline),Math.max(1,Number(p.maxVotes)||1),boolGallery_(p.commentsEnabled,false),boolGallery_(p.anonymousVoting,true),boolGallery_(p.allowLate,true),boolGallery_(p.lateEligible,false),boolGallery_(p.revealResults,false),existing?cleanGallery_(existing['Drive Folder ID']):'',existing?existing['Created At']:nowGallery_(),nowGallery_()];
  if(existing) sh.getRange(existing._row,1,1,row.length).setValues([row]); else sh.appendRow(row); return {success:true,projectId:id};
}

function setSubmissionGallery_(p){ if(!teacherOKGallery_(p)) throw new Error('Teacher key is not valid.'); const r=rowsGallery_('Submissions').find(x=>cleanGallery_(x['Submission ID'])===cleanGallery_(p.submissionId)); if(!r) throw new Error('Submission not found.'); const sh=sheetGallery_('Submissions'); if(p.hidden!=null) sh.getRange(r._row,14).setValue(boolGallery_(p.hidden,false)); if(p.eligible!=null) sh.getRange(r._row,13).setValue(boolGallery_(p.eligible,true)); return {success:true}; }
function setCommentGallery_(p){ if(!teacherOKGallery_(p)) throw new Error('Teacher key is not valid.'); const r=rowsGallery_('Comments').find(x=>cleanGallery_(x['Comment ID'])===cleanGallery_(p.commentId)); if(!r) throw new Error('Comment not found.'); const sh=sheetGallery_('Comments'); if(p.approved!=null) sh.getRange(r._row,10).setValue(boolGallery_(p.approved,false)); if(p.hidden!=null) sh.getRange(r._row,11).setValue(boolGallery_(p.hidden,false)); return {success:true}; }
