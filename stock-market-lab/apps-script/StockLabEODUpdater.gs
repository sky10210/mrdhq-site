const STOCK_LAB = {
  spreadsheetId: '1IIVVQCIGkUgk6VdPtDi7dMn-bNdg5imA4Qrgw67qPW0',
  marketSheet: 'Market Data',
  historySheet: 'Price History',
  expectedCount: 185,
  firstDataRow: 2,
  timeZone: 'America/New_York'
};

function refreshAndArchiveStockLab() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('Another Stock Lab refresh is already running.');
  try {
    const ss = SpreadsheetApp.openById(STOCK_LAB.spreadsheetId);
    const market = ss.getSheetByName(STOCK_LAB.marketSheet);
    const history = ss.getSheetByName(STOCK_LAB.historySheet);
    if (!market || !history) throw new Error('Required Stock Lab sheet tab is missing.');

    const tickers = market.getRange(STOCK_LAB.firstDataRow, 1, STOCK_LAB.expectedCount, 1)
      .getDisplayValues().flat().map(x => String(x).trim().toUpperCase());

    if (tickers.filter(Boolean).length !== STOCK_LAB.expectedCount || new Set(tickers).size !== STOCK_LAB.expectedCount) {
      throw new Error('Stock universe is not exactly ' + STOCK_LAB.expectedCount + ' unique tickers.');
    }

    market.getRange(STOCK_LAB.firstDataRow, 4, STOCK_LAB.expectedCount, 7).clearContent();

    const formulas = tickers.map((_, i) => {
      const row = STOCK_LAB.firstDataRow + i;
      return ['=LET(g,GOOGLEFINANCE($A' + row + ',"close",TODAY()-7,TODAY(),"DAILY"),' +
        'n,ROWS(g),cur,INDEX(g,n,2),prev,INDEX(g,n-1,2),dt,INT(INDEX(g,n,1)),' +
        '{cur,prev,cur-prev,(cur-prev)/prev,dt,"Google Finance","OK"})'];
    });
    market.getRange(STOCK_LAB.firstDataRow, 4, STOCK_LAB.expectedCount, 1).setFormulas(formulas);

    let snapshot = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      SpreadsheetApp.flush();
      Utilities.sleep(attempt === 0 ? 5000 : 2500);
      snapshot = readVerifiedSnapshot_(market);
      if (snapshot.ok) break;
    }
    if (!snapshot || !snapshot.ok) {
      throw new Error(snapshot && snapshot.error ? snapshot.error : 'Market snapshot did not finish calculating.');
    }

    const archived = archiveSnapshot_(history, snapshot);
    PropertiesService.getScriptProperties().setProperties({
      STOCK_LAB_LAST_REFRESH: new Date().toISOString(),
      STOCK_LAB_LAST_TRADING_DATE: snapshot.asOf,
      STOCK_LAB_LAST_COUNT: String(snapshot.rows.length),
      STOCK_LAB_LAST_ARCHIVE_RESULT: archived ? 'ARCHIVED' : 'ALREADY_ARCHIVED'
    }, true);

    return {success:true,archived,asOf:snapshot.asOf,count:snapshot.rows.length,source:'Google Finance'};
  } finally {
    lock.releaseLock();
  }
}

function readVerifiedSnapshot_(market) {
  const range = market.getRange(STOCK_LAB.firstDataRow, 1, STOCK_LAB.expectedCount, 10);
  const values = range.getValues();
  const display = range.getDisplayValues();
  const rows = [];
  const dates = new Set();
  const tickerSet = new Set();

  for (let i = 0; i < STOCK_LAB.expectedCount; i++) {
    const ticker = String(display[i][0] || '').trim().toUpperCase();
    const company = String(display[i][1] || '').trim();
    const industry = String(display[i][2] || '').trim();
    const price = Number(values[i][3]);
    const previousClose = Number(values[i][4]);
    const change = Number(values[i][5]);
    const changePercent = Number(values[i][6]);
    const asOf = normalizeDate_(values[i][7] || display[i][7]);
    const source = String(display[i][8] || '').trim();
    const status = String(display[i][9] || '').trim();

    if (!ticker || tickerSet.has(ticker)) return {ok:false,error:'Missing or duplicate ticker at row ' + (i + STOCK_LAB.firstDataRow)};
    tickerSet.add(ticker);
    if (!(price > 0) || !(previousClose > 0) || !Number.isFinite(change) || !Number.isFinite(changePercent)) return {ok:false,error:'Invalid price data for ' + ticker};
    if (!asOf) return {ok:false,error:'Missing trading date for ' + ticker};
    if (status !== 'OK') return {ok:false,error:'Non-OK status for ' + ticker + ': ' + status};
    dates.add(asOf);
    rows.push({ticker,company,industry,price,previousClose,change,changePercent,asOf,source:source || 'Google Finance'});
  }

  if (rows.length !== STOCK_LAB.expectedCount) return {ok:false,error:'Expected 185 rows, found ' + rows.length};
  if (dates.size !== 1) return {ok:false,error:'Mixed trading dates: ' + Array.from(dates).join(', ')};

  return {ok:true,asOf:Array.from(dates)[0],rows};
}

function archiveSnapshot_(history, snapshot) {
  const lastRow = history.getLastRow();
  const existing = lastRow > 1 ? history.getRange(2, 1, lastRow - 1, 2).getValues() : [];
  const existingKeys = new Set(existing.map(r => normalizeDate_(r[0]) + '|' + String(r[1] || '').trim().toUpperCase()));

  const missing = snapshot.rows.filter(r => !existingKeys.has(snapshot.asOf + '|' + r.ticker));
  const existingForDate = snapshot.rows.length - missing.length;

  if (existingForDate > 0 && missing.length > 0) {
    throw new Error('Price History already contains a partial ' + snapshot.asOf + ' archive (' + existingForDate + '/' + snapshot.rows.length + '). Fix it before appending.');
  }
  if (missing.length === 0) return false;

  const savedAt = Utilities.formatDate(new Date(), STOCK_LAB.timeZone, 'yyyy-MM-dd HH:mm:ss');
  const output = missing.map(r => [
    snapshot.asOf, r.ticker, r.company, r.industry,
    r.price, r.previousClose, r.change, r.changePercent,
    r.source, 'Archived ' + savedAt
  ]);

  history.getRange(history.getLastRow() + 1, 1, output.length, 10).setValues(output);
  return true;
}

function doGet(e) {
  let payload;
  try {
    const ss = SpreadsheetApp.openById(STOCK_LAB.spreadsheetId);
    const market = ss.getSheetByName(STOCK_LAB.marketSheet);
    const snapshot = readVerifiedSnapshot_(market);
    if (!snapshot.ok) throw new Error(snapshot.error);

    const prices = {};
    snapshot.rows.forEach(r => {
      prices[r.ticker] = {
        price: r.price,
        previousClose: r.previousClose,
        change: r.change,
        changePercent: r.changePercent,
        asOf: r.asOf,
        source: r.source
      };
    });
    payload = {success:true,count:snapshot.rows.length,asOf:snapshot.asOf,source:'Google Finance',prices};
  } catch (err) {
    payload = {success:false,error:String(err && err.message ? err.message : err)};
  }

  const callback = sanitizeCallback_((e && e.parameter && e.parameter.callback) || 'stockLabReceiveMarket');
  return ContentService.createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function installStockLabDailyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'refreshAndArchiveStockLab')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('refreshAndArchiveStockLab')
    .timeBased()
    .everyDays(1)
    .atHour(19)
    .nearMinute(15)
    .inTimezone(STOCK_LAB.timeZone)
    .create();
}

function stockLabHealthCheck() {
  const ss = SpreadsheetApp.openById(STOCK_LAB.spreadsheetId);
  const snapshot = readVerifiedSnapshot_(ss.getSheetByName(STOCK_LAB.marketSheet));
  const props = PropertiesService.getScriptProperties().getProperties();
  Logger.log(JSON.stringify({snapshot,properties:props}, null, 2));
  return {snapshot,properties:props};
}

function normalizeDate_(value) {
  if (value instanceof Date && !isNaN(value)) return Utilities.formatDate(value, STOCK_LAB.timeZone, 'yyyy-MM-dd');
  if (typeof value === 'number' && isFinite(value)) {
    const millis = Math.round((value - 25569) * 86400000);
    return Utilities.formatDate(new Date(millis), 'UTC', 'yyyy-MM-dd');
  }
  const s = String(value || '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    if (n > 30000 && n < 90000) {
      const millis = Math.round((n - 25569) * 86400000);
      return Utilities.formatDate(new Date(millis), 'UTC', 'yyyy-MM-dd');
    }
  }
  const d = new Date(s);
  return isNaN(d) ? '' : Utilities.formatDate(d, STOCK_LAB.timeZone, 'yyyy-MM-dd');
}

function sanitizeCallback_(name) {
  const s = String(name || '');
  return /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(s) ? s : 'stockLabReceiveMarket';
}
