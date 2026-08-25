// MRDHQ Opening Bell — Google Apps Script collector
// Attach this script to: MRDHQ Opening Bell Responses 2026-27
// Deploy as Web App: Execute as Me | Who has access: Anyone

function doGet(e) {
  try {
    var p = e && e.parameter ? e.parameter : {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
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
    var dateText = formatDate_(ts);

    var row = [
      ts,
      dateText,
      className,
      block,
      firstName,
      lastName,
      bellId,
      question,
      answer,
      status,
      duration ? duration + (String(duration).toLowerCase().indexOf('min') >= 0 ? '' : ' min') : ''
    ];

    master.appendRow(row);
    ensureClassView_(ss, className);

    return json_({success:true,status:status});
  } catch (err) {
    return json_({success:false,error:String(err)});
  }
}

function normalizeClass_(value) {
  if (value === 'Personal Financial Management') return 'Personal Finance';
  return value;
}

function normalizeStatus_(p) {
  var raw = String(p.status || '').trim().toLowerCase();
  var label = String(p.label || '').trim().toLowerCase();
  var makeup = String(p.makeup || '') === '1' || raw.indexOf('makeup') >= 0 || label === 'makeup';
  var late = String(p.late || '') === '1' || raw.indexOf('late') >= 0;

  if (makeup) return 'Makeup — After Class/Absent';
  if (late) return 'Late — Same Day';
  return 'On Time';
}

function getOrCreateResponseSheet_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(['Timestamp','Date','Class','Block','First Name','Last Name','Question ID','Question','Response','Status','Duration']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function ensureClassView_(ss, className) {
  if (!className) return;
  var allowed = ['AP Business','Marketing','Business 101','Personal Finance'];
  if (allowed.indexOf(className) === -1) return;
  var sh = ss.getSheetByName(className);
  if (!sh) return;
  // Class tabs are FILTER views of the master Responses tab.
}

function parseTimestamp_(value) {
  if (!value) return new Date();
  var d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
}

function formatDate_(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone() || 'America/New_York', 'M/d/yyyy');
}

function clean_(v) {
  return v == null ? '' : String(v).trim();
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
