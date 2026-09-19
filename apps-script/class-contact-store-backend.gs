/**
 * MRDHQ Class Contact + Student Store Application handler
 * Add these cases/functions to the deployed MRDHQ Apps Script backend.
 * The existing deployment URL can stay the same after a new deployment version is published.
 */
const CLASS_CONTACT_SHEET_ID = '1VHmIt7cjL_BcXtPfdzNEy-W82xuy8rLiHojR925o9Gc';
const STORE_APPLICATION_SHEET_ID = '1WucZpDSt3SfJh0Se5eNLCt2O2Ti25GyE_jtP6t-WMXc';
const MR_D_EMAIL = 'skyler.dipasquale@casdonline.org';

function handleClassContact_(p) {
  const ss = SpreadsheetApp.openById(CLASS_CONTACT_SHEET_ID);
  const sh = ss.getSheetByName('ALL RESPONSES');
  const row = [new Date(),p.firstName||'',p.lastName||'',p.className||'',p.block||'',p.category||'',p.topic||'',p.message||'',p.link||'',p.pos||'','NEW'];
  sh.appendRow(row);
  MailApp.sendEmail(MR_D_EMAIL,'MRDHQ Class Contact — '+(p.category||'New Submission'),
    (p.firstName||'')+' '+(p.lastName||'')+'\nClass: '+(p.className||'')+' / '+(p.block||'')+'\nCategory: '+(p.category||'')+'\nTopic: '+(p.topic||'')+'\n\n'+(p.message||'')+'\n\nLink: '+(p.link||'None'));
  return {success:true};
}

function handleStudentStoreApplication_(p) {
  const ss = SpreadsheetApp.openById(STORE_APPLICATION_SHEET_ID);
  const sh = ss.getSheetByName('SEM 2 APPLICATIONS');
  sh.appendRow([new Date(),p.firstName||'',p.lastName||'',p.grade||'',p.classBlock||'',p.why||'',p.strengths||'',p.availability||'',p.experience||'',p.improve||'',p.reference||'',p.anything||'',p.pos||'','NEW','']);
  MailApp.sendEmail(MR_D_EMAIL,'Student Store Semester 2 Application — '+(p.firstName||'')+' '+(p.lastName||''),
    'A new Semester 2 Student Store application was submitted.\n\nApplicant: '+(p.firstName||'')+' '+(p.lastName||'')+'\nGrade: '+(p.grade||'')+'\nAvailability: '+(p.availability||'')+'\n\nOpen the Student Store application sheet to review it.');
  return {success:true};
}

/*
In the deployed doPost(e), before the existing routing, add:

if (e.parameter.action === 'classContact') {
  return ContentService.createTextOutput(JSON.stringify(handleClassContact_(e.parameter))).setMimeType(ContentService.MimeType.JSON);
}
if (e.parameter.action === 'studentStoreApplication') {
  return ContentService.createTextOutput(JSON.stringify(handleStudentStoreApplication_(e.parameter))).setMimeType(ContentService.MimeType.JSON);
}
*/