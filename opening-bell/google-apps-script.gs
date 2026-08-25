// MRDHQ Opening Bell — Google Apps Script collector
// Attach this script to the Google Sheet: MRDHQ Opening Bell Responses 2026-27

function doGet(e) {
  try {
    var p = e.parameter;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Responses');
    if (!sh) {
      sh = ss.insertSheet('Responses');
      sh.appendRow(['Timestamp','Date','Class','Block','Student Name','Question ID','Question','Response','Status','Duration']);
      sh.setFrozenRows(1);
    }
    sh.appendRow([
      p.timestamp || new Date().toISOString(),
      p.date || '',
      p.cls || '',
      p.block || '',
      p.name || '',
      p.qid || '',
      p.question || '',
      p.answer || '',
      p.status || 'On Time',
      (p.duration || '') + (p.duration ? ' min' : '')
    ]);
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success:false,error:String(err)})).setMimeType(ContentService.MimeType.JSON);
  }
}
