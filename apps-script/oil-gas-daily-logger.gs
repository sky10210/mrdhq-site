// MRDHQ Oil/Gas daily archive logger
// Paste this into the Apps Script project attached to the
// "MRDHQ Oil-Gas Tracker Data" spreadsheet, then run installDailyTrigger() once.

const OIL_GAS_SPREADSHEET_ID = '11MLY93AggLphb1GWu3gXhrmt4dkWFPXehZ02t4c-z5Y';
const OIL_GAS_SHEET_NAME = 'Daily Log';
const OIL_GAS_API = 'https://mrdhq.com/api/oil-gas?refresh=1';

function logOilGasDaily() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const response = UrlFetchApp.fetch(OIL_GAS_API, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {'User-Agent': 'MRDHQ Oil Gas Archive'}
    });

    if (response.getResponseCode() !== 200) {
      throw new Error('Oil/Gas API returned HTTP ' + response.getResponseCode());
    }

    const data = JSON.parse(response.getContentText());
    const pa = pointValue_(data.pa, 'Current');
    const local = pointValue_(data.local, 'Current');
    const brent = Number(data.brent && data.brent.price);
    const brentPct = Number(data.brent && data.brent.pct);

    if (!Number.isFinite(brent) && !Number.isFinite(pa) && !Number.isFinite(local)) {
      throw new Error('No usable Oil/Gas values were returned.');
    }

    const ss = SpreadsheetApp.openById(OIL_GAS_SPREADSHEET_ID);
    const sheet = ss.getSheetByName(OIL_GAS_SHEET_NAME);
    if (!sheet) throw new Error('Daily Log sheet not found.');

    const tz = 'America/New_York';
    const now = new Date();
    const dateKey = Utilities.formatDate(now, tz, 'yyyy-MM-dd');

    // One row per calendar day. If today's row already exists, update it.
    const lastRow = sheet.getLastRow();
    let targetRow = lastRow + 1;
    if (lastRow >= 2) {
      const existing = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
      for (let i = existing.length - 1; i >= 0; i--) {
        const raw = existing[i][0];
        const parsed = raw ? new Date(raw) : null;
        const existingKey = parsed && !isNaN(parsed) ? Utilities.formatDate(parsed, tz, 'yyyy-MM-dd') : raw;
        if (existingKey === dateKey) {
          targetRow = i + 2;
          break;
        }
      }
    }

    const notes = data.note || '';
    sheet.getRange(targetRow, 1, 1, 8).setValues([[
      now,
      now,
      Number.isFinite(brent) ? brent : '',
      Number.isFinite(brentPct) ? brentPct / 100 : '',
      Number.isFinite(pa) ? pa : '',
      Number.isFinite(local) ? local : '',
      data.status || '',
      notes
    ]]);

    sheet.getRange(targetRow, 1).setNumberFormat('m/d/yyyy');
    sheet.getRange(targetRow, 2).setNumberFormat('m/d/yyyy h:mm AM/PM');
    sheet.getRange(targetRow, 3).setNumberFormat('$0.00');
    sheet.getRange(targetRow, 4).setNumberFormat('0.0%');
    sheet.getRange(targetRow, 5, 1, 2).setNumberFormat('$0.0000');
  } finally {
    lock.releaseLock();
  }
}

function pointValue_(points, label) {
  if (!Array.isArray(points)) return NaN;
  const point = points.find(item => item && item.label === label);
  return Number(point && point.value);
}

function installDailyTrigger() {
  // Remove older copies of this logger trigger first so duplicate rows cannot be created.
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'logOilGasDaily')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('logOilGasDaily')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .nearMinute(15)
    .inTimezone('America/New_York')
    .create();
}

function testOilGasLogger() {
  logOilGasDaily();
}
