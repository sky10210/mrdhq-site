/**
 * MRDHQ Info Board backend.
 * Add this file to the SAME deployed Apps Script project already used by MRDHQ.
 * Then add the routing snippets noted at bottom to the project's doGet(e) / doPost(e).
 * Storage uses ScriptProperties, so no extra Sheet is required.
 */
// Set INFO_BOARD_TEACHER_PASSWORD in Apps Script > Project Settings > Script Properties.
// No teacher credential is stored in the public repository.
const INFO_BOARD_KEY = 'MRDHQ_INFO_BOARD_V1';
const INFO_BOARD_TOKEN_PREFIX = 'MRDHQ_INFO_TOKEN_';

function infoBoardRead_() {
  const raw = PropertiesService.getScriptProperties().getProperty(INFO_BOARD_KEY);
  if (!raw) return {posts:[], events:[]};
  try {
    const data = JSON.parse(raw);
    return {posts:Array.isArray(data.posts)?data.posts:[], events:Array.isArray(data.events)?data.events:[]};
  } catch (err) {
    return {posts:[], events:[]};
  }
}
function infoBoardWrite_(data) {
  data.posts = (data.posts || []).slice(0,150);
  data.events = (data.events || []).filter(x => x && x.date).slice(0,300);
  PropertiesService.getScriptProperties().setProperty(INFO_BOARD_KEY, JSON.stringify(data));
  return data;
}
function infoBoardJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function infoBoardId_() {
  return Utilities.getUuid();
}
function infoBoardAuth_(p) {
  const configuredPassword = PropertiesService.getScriptProperties().getProperty('INFO_BOARD_TEACHER_PASSWORD');
  if (!configuredPassword) return {success:false,error:'Teacher password is not configured in Script Properties.'};
  if ((p.password || '') !== configuredPassword) return {success:false,error:'Incorrect teacher password.'};
  const token = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put(INFO_BOARD_TOKEN_PREFIX + token, '1', 21600);
  return {success:true, token:token};
}
function infoBoardAuthorized_(p) {
  const token = p.token || '';
  return !!token && CacheService.getScriptCache().get(INFO_BOARD_TOKEN_PREFIX + token) === '1';
}
function infoBoardHandleGet_(p) {
  return {success:true,data:infoBoardRead_(),serverTime:new Date().toISOString()};
}
function infoBoardHandlePost_(p) {
  if (p.action === 'infoBoardAuth') return infoBoardAuth_(p);
  if (!infoBoardAuthorized_(p)) return {success:false,error:'Teacher session expired. Unlock editing again.'};
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return {success:false,error:'Board is busy. Please try saving again.'};
  try {
  const data = infoBoardRead_();
  const now = new Date().toISOString();

  if (p.action === 'infoBoardAddPost') {
    data.posts.unshift({id:infoBoardId_(),text:String(p.text||'').slice(0,5000),course:String(p.course||'ALL').slice(0,12),pinned:String(p.pinned)==='1',createdAt:now,updatedAt:now});
  } else if (p.action === 'infoBoardEditPost') {
    const post = data.posts.find(x => x.id === p.id);
    if (!post) return {success:false,error:'Update not found.'};
    post.text = String(p.text||'').slice(0,5000); post.updatedAt = now;
  } else if (p.action === 'infoBoardDeletePost') {
    data.posts = data.posts.filter(x => x.id !== p.id);
  } else if (p.action === 'infoBoardAddEvent') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(p.date||''))) return {success:false,error:'Invalid date.'};
    data.events.push({id:infoBoardId_(),date:p.date,text:String(p.text||'').slice(0,500),course:String(p.course||'ALL').slice(0,12),createdAt:now});
  } else if (p.action === 'infoBoardEditEvent') {
    const event = data.events.find(x => x.id === p.id);
    if (!event) return {success:false,error:'Calendar item not found.'};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(p.date||''))) return {success:false,error:'Invalid date.'};
    event.date = String(p.date); event.text = String(p.text||'').slice(0,500);
    event.course = String(p.course||'ALL').slice(0,12); event.updatedAt = now;
  } else if (p.action === 'infoBoardDeleteEvent') {
    data.events = data.events.filter(x => x.id !== p.id);
  } else {
    return {success:false,error:'Unknown Info Board action.'};
  }
  return {success:true,data:infoBoardWrite_(data)};
  } finally { lock.releaseLock(); }
}

/*
ADD TO doGet(e):
if (e.parameter.action === 'infoBoardGet') {
  return infoBoardJson_(infoBoardHandleGet_(e.parameter));
}

ADD NEAR THE TOP OF doPost(e):
if (String(e.parameter.action || '').indexOf('infoBoard') === 0) {
  return infoBoardJson_(infoBoardHandlePost_(e.parameter));
}
*/