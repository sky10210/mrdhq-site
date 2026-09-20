/**
 * MRDHQ Stock Market Lab — Google Sheets EOD updater
 * Paste into Extensions > Apps Script for the Stock Market Lab - Market Data sheet.
 * Uses the same Stooq daily bulk source as the site updater, once per day.
 */
const STOOQ_ZIP_URL = 'https://static.stooq.com/db/h/d_us_txt.zip';

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Stock Lab')
    .addItem('Refresh EOD prices now', 'refreshEodPrices')
    .addItem('Install weekday evening trigger', 'installEodTrigger')
    .addToUi();
}

function installEodTrigger() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'refreshEodPrices')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('refreshEodPrices').timeBased().everyDays(1).atHour(19).create();
  SpreadsheetApp.getActive().toast('Installed: EOD refresh runs each evening in the script time zone.');
}

function refreshEodPrices() {
  const sh = SpreadsheetApp.getActive().getSheetByName('Market Data');
  const last = sh.getLastRow();
  const tickers = sh.getRange(2,1,last-1,1).getDisplayValues().flat().filter(Boolean);
  const wanted = new Set(tickers.map(t => t.toUpperCase()));
  const blob = UrlFetchApp.fetch(STOOQ_ZIP_URL, {muteHttpExceptions:false}).getBlob();
  const files = Utilities.unzip(blob);
  const found = {};
  files.forEach(file => {
    let name = file.getName().toUpperCase();
    let ticker = name.replace(/\.TXT$/,'').replace(/\.US$/,'');
    if (!wanted.has(ticker)) return;
    const lines = file.getDataAsString().trim().split(/\r?\n/);
    if (lines.length < 3) return;
    const header = lines[0].split(',');
    const di = header.indexOf('<DATE>'), ci = header.indexOf('<CLOSE>');
    if (di < 0 || ci < 0) return;
    const vals = lines.slice(1).map(x=>x.split(',')).filter(x=>x[di]&&Number(x[ci])>0);
    vals.sort((a,b)=>a[di].localeCompare(b[di]));
    const a=vals[vals.length-1], p=vals[vals.length-2];
    const close=Number(a[ci]), prev=Number(p[ci]), change=close-prev;
    found[ticker]=[close,prev,change,prev?change/prev:0,a[di],'Stooq EOD','OK'];
  });
  if (Object.keys(found).length < Math.ceil(wanted.size*.90)) throw new Error('Safety stop: only '+Object.keys(found).length+' of '+wanted.size+' tickers found.');
  const out=tickers.map(t=>found[t.toUpperCase()]||['','','','','','','MISSING']);
  sh.getRange(2,4,out.length,7).setValues(out);
  sh.getRange(2,7,out.length,1).setNumberFormat('0.00%');
  sh.getRange('L1').setValue('Last refresh');
  sh.getRange('M1').setValue(new Date());
  SpreadsheetApp.flush();
}