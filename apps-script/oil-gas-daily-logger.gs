// MRDHQ Oil/Gas daily archive logger + history feed
// Attach this script to the "MRDHQ Oil-Gas Tracker Data" spreadsheet.
// Run installDailyTrigger() once, then deploy as a Web App (execute as you,
// access: anyone) if you want the public Oil/Gas page to read semester history.

const OIL_GAS_SPREADSHEET_ID = '11MLY93AggLphb1GWu3gXhrmt4dkWFPXehZ02t4c-z5Y';
const OIL_GAS_SHEET_NAME = 'Daily Log';
const OIL_GAS_API = 'https://mrdhq.com/api/oil-gas?refresh=1';
const OIL_GAS_TZ = 'America/New_York';

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

    const now = new Date();
    const dateKey = Utilities.formatDate(now, OIL_GAS_TZ, 'yyyy-MM-dd');

    // One row per calendar day. If today's row already exists, update it.
    const lastRow = sheet.getLastRow();
    let targetRow = lastRow + 1;
    if (lastRow >= 2) {
      const existing = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (let i = existing.length - 1; i >= 0; i--) {
        const value = existing[i][0];
        const existingKey = value instanceof Date
          ? Utilities.formatDate(value, OIL_GAS_TZ, 'yyyy-MM-dd')
          : String(value || '').trim();
        if (existingKey === dateKey || existingKey === Utilities.formatDate(now, OIL_GAS_TZ, 'M/d/yyyy')) {
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
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'logOilGasDaily')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('logOilGasDaily')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .nearMinute(15)
    .inTimezone(OIL_GAS_TZ)
    .create();
}

function testOilGasLogger() {
  logOilGasDaily();
}

// Public, read-only history feed for the classroom page.
// Returns only market-price data; no student information is stored here.
function doGet(e) {
  try {
    const limitRaw = Number(e && e.parameter && e.parameter.limit);
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 220, 1), 500);

    const ss = SpreadsheetApp.openById(OIL_GAS_SPREADSHEET_ID);
    const sheet = ss.getSheetByName(OIL_GAS_SHEET_NAME);
    if (!sheet) throw new Error('Daily Log sheet not found.');

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return jsonOutput_({updatedAt: new Date().toISOString(), points: []});

    const startRow = Math.max(2, lastRow - limit + 1);
    const rows = sheet.getRange(startRow, 1, lastRow - startRow + 1, 8).getValues();
    const points = rows.map(row => ({
      date: row[0] instanceof Date ? Utilities.formatDate(row[0], OIL_GAS_TZ, 'yyyy-MM-dd') : String(row[0] || ''),
      recordedAt: row[1] instanceof Date ? row[1].toISOString() : String(row[1] || ''),
      brent: finiteOrNull_(row[2]),
      brentPct: Number.isFinite(Number(row[3])) ? Number(row[3]) * 100 : null,
      pa: finiteOrNull_(row[4]),
      local: finiteOrNull_(row[5]),
      status: String(row[6] || ''),
      notes: String(row[7] || '')
    })).filter(point => point.date);

    return jsonOutput_({
      updatedAt: new Date().toISOString(),
      count: points.length,
      points
    });
  } catch (error) {
    return jsonOutput_({error: String(error && error.message || error)});
  }
}

function finiteOrNull_(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function jsonOutput_(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
