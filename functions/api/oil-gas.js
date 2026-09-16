const AAA_URL = 'https://gasprices.aaa.com/?state=PA';
const YAHOO_BRENT_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/BZ%3DF?range=10y&interval=1d&includePrePost=false&events=div%2Csplits';
const FRED_GAS_URL = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=APUS12B74714';
const SHORT_LABELS = ['Year Ago', 'Month Ago', 'Week Ago', 'Yesterday', 'Current'];
const DAY = 86400000;

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': status === 200 ? 'public, max-age=900, s-maxage=21600, stale-while-revalidate=86400' : 'no-store',
    'Access-Control-Allow-Origin': '*',
    'X-Content-Type-Options': 'nosniff',
    ...headers
  }
});

async function fetchText(url, timeout = 20000) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MRDHQ classroom energy tracker',
      'Accept': 'text/html,application/xhtml+xml,application/json,text/csv,*/*'
    },
    signal: AbortSignal.timeout(timeout)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function decodeText(value = '') {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#8211;|&ndash;/gi, '–')
    .replace(/\s+/g, ' ')
    .trim();
}

function tableAfterText(html, needle) {
  const lower = html.toLowerCase();
  const start = lower.indexOf(needle.toLowerCase());
  if (start < 0) return '';
  const tableStart = lower.indexOf('<table', start);
  const tableEnd = lower.indexOf('</table>', tableStart);
  return tableStart >= 0 && tableEnd >= 0 ? html.slice(tableStart, tableEnd + 8) : '';
}

function findSectionTable(html, names) {
  for (const name of names) {
    const table = tableAfterText(html, name);
    if (table) return table;
  }
  return '';
}

function parseRegularPoints(table) {
  if (!table) return [];
  const byLabel = {};
  const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  for (const row of rows) {
    const text = decodeText(row);
    const match = text.match(/\b(Current|Yesterday|Week Ago|Month Ago|Year Ago)\s+Avg\.\s*\$?([0-9]+(?:\.[0-9]+)?)/i);
    if (!match) continue;
    const label = SHORT_LABELS.find(x => x.toLowerCase() === match[1].toLowerCase());
    const value = Number(match[2]);
    if (label && Number.isFinite(value)) byLabel[label] = value;
  }
  return SHORT_LABELS.map(label => ({label, value: byLabel[label]})).filter(p => Number.isFinite(p.value));
}

function parseAAA(html) {
  const paTable = findSectionTable(html, ['Pennsylvania</span> average gas prices', 'Pennsylvania average gas prices']);
  const localTable = findSectionTable(html, ['Chambersburg-Waynesboro', 'Chambersburg–Waynesboro']);
  return {pa: parseRegularPoints(paTable), local: parseRegularPoints(localTable)};
}

function parseBrent(data) {
  const result = data?.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const closes = result?.indicators?.quote?.[0]?.close || [];
  const rows = timestamps.map((ts, i) => ({date: new Date(Number(ts) * 1000).toISOString().slice(0,10), time: Number(ts) * 1000, value: Number(closes[i])}))
    .filter(r => Number.isFinite(r.time) && Number.isFinite(r.value) && r.value > 10 && r.value < 250)
    .sort((a,b) => a.time - b.time);
  if (!rows.length) return {history: [], latest: null, previous: null};

  const cutoff = Date.now() - 6 * 365.25 * DAY;
  const sixYears = rows.filter(r => r.time >= cutoff);
  const sampled = [];
  let lastBucket = '';
  for (const row of sixYears) {
    const d = new Date(row.time);
    const jan1 = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const week = Math.floor((row.time - jan1.getTime()) / (7 * DAY));
    const bucket = `${d.getUTCFullYear()}-${week}`;
    if (bucket !== lastBucket) {
      sampled.push({date: row.date, value: Number(row.value.toFixed(2))});
      lastBucket = bucket;
    } else {
      sampled[sampled.length - 1] = {date: row.date, value: Number(row.value.toFixed(2))};
    }
  }
  const latest = rows[rows.length - 1];
  const previous = rows.length > 1 ? rows[rows.length - 2] : null;
  return {
    history: sampled,
    latest: latest ? {date: latest.date, value: Number(latest.value.toFixed(2))} : null,
    previous: previous ? {date: previous.date, value: Number(previous.value.toFixed(2))} : null
  };
}

function parseFredGas(csv) {
  const rows = String(csv || '').trim().split(/\r?\n/).slice(1).map(line => {
    const [date, raw] = line.split(',');
    const value = Number(raw);
    return {date, value};
  }).filter(r => /^\d{4}-\d{2}-\d{2}$/.test(r.date) && Number.isFinite(r.value) && r.value > 0 && r.value < 10);
  const cutoff = Date.now() - 6 * 365.25 * DAY;
  return rows.filter(r => new Date(r.date + 'T00:00:00Z').getTime() >= cutoff).map(r => ({date:r.date, value:Number(r.value.toFixed(3))}));
}

const administrations = [
  {start:'2017-01-20', end:'2021-01-20', label:'Trump'},
  {start:'2021-01-20', end:'2025-01-20', label:'Biden'},
  {start:'2025-01-20', end:null, label:'Trump'}
];

const events = [
  {date:'2020-03-11', title:'COVID-19 pandemic shock', detail:'Travel and economic activity fell sharply, cutting fuel demand and adding extreme volatility to oil markets.', kind:'demand'},
  {date:'2022-02-24', title:'Russia invades Ukraine', detail:'The invasion and subsequent sanctions disrupted global energy trade and increased uncertainty around supply.', kind:'geopolitical'},
  {date:'2023-04-02', title:'OPEC+ announces additional cuts', detail:'Major producers announced voluntary output cuts, tightening expected supply.', kind:'supply'},
  {date:'2026-02-28', title:'U.S.-Israeli strikes on Iran begin', detail:'The conflict raised risks to Middle East production and shipping through the Strait of Hormuz.', kind:'geopolitical'},
  {date:'2026-09-11', title:'Saudi East-West pipeline attacked', detail:'A drone attack forced a shutdown of a major Saudi route to the Red Sea, increasing concern about export capacity.', kind:'supply'},
  {date:'2026-09-15', title:'Saudi loadings disrupted at Yanbu', detail:'Cargo cancellations and reduced loadings increased competition for replacement crude supplies.', kind:'supply'}
];

function mergeWithLastGood(fresh, lastGood) {
  return {
    updatedAt: fresh.updatedAt,
    sourceDate: fresh.sourceDate,
    brent: fresh.brent || lastGood?.brent || null,
    brentHistory: fresh.brentHistory?.length ? fresh.brentHistory : lastGood?.brentHistory || [],
    regionalGasHistory: fresh.regionalGasHistory?.length ? fresh.regionalGasHistory : lastGood?.regionalGasHistory || [],
    pa: fresh.pa?.length ? fresh.pa : lastGood?.pa || [],
    local: fresh.local?.length ? fresh.local : lastGood?.local || [],
    administrations,
    events,
    sources: fresh.sources,
    status: fresh.status,
    note: fresh.note || null
  };
}

export async function onRequestGet({request, waitUntil}) {
  const url = new URL(request.url);
  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}/api/oil-gas?version=6`);
  const lastGoodKey = new Request(`${url.origin}/api/oil-gas?last-good=6`);
  const cached = await cache.match(cacheKey);
  if (cached && url.searchParams.get('refresh') !== '1') return cached;

  const [aaaResult, brentResult, gasHistoryResult, lastGoodResult] = await Promise.allSettled([
    fetchText(AAA_URL),
    fetchText(YAHOO_BRENT_URL).then(JSON.parse),
    fetchText(FRED_GAS_URL),
    cache.match(lastGoodKey)
  ]);

  let aaa = {pa:[], local:[]};
  if (aaaResult.status === 'fulfilled') { try { aaa = parseAAA(aaaResult.value); } catch {} }
  let brentParsed = {history:[], latest:null, previous:null};
  if (brentResult.status === 'fulfilled') { try { brentParsed = parseBrent(brentResult.value); } catch {} }
  let regionalGasHistory = [];
  if (gasHistoryResult.status === 'fulfilled') { try { regionalGasHistory = parseFredGas(gasHistoryResult.value); } catch {} }

  let lastGood = null;
  if (lastGoodResult.status === 'fulfilled' && lastGoodResult.value) { try { lastGood = await lastGoodResult.value.json(); } catch {} }

  const brent = brentParsed.previous ? {
    price: brentParsed.previous.value,
    date: brentParsed.previous.date,
    latestClose: brentParsed.latest?.value ?? null,
    latestDate: brentParsed.latest?.date ?? null,
    source: 'Brent futures close (BZ=F)'
  } : null;

  const fullPA = aaa.pa.length === 5;
  const fullLocal = aaa.local.length === 5;
  const complete = Boolean(brent) && brentParsed.history.length > 200 && regionalGasHistory.length > 60 && fullPA && fullLocal;
  const partial = Boolean(brent) || brentParsed.history.length || regionalGasHistory.length || aaa.pa.length || aaa.local.length;
  if (!partial && !lastGood) return json({error:'Energy data is temporarily unavailable.'}, 503);

  const missing = [];
  if (!brent) missing.push('Brent previous close');
  if (brentParsed.history.length < 200) missing.push('Brent history');
  if (regionalGasHistory.length < 60) missing.push('regional gas history');
  if (!fullPA) missing.push('PA gas comparison');
  if (!fullLocal) missing.push('local gas comparison');

  const now = new Date();
  const fresh = {
    updatedAt: now.toISOString(),
    sourceDate: new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',year:'numeric'}).format(now),
    brent,
    brentHistory: brentParsed.history,
    regionalGasHistory,
    pa: aaa.pa,
    local: aaa.local,
    administrations,
    events,
    sources: {
      aaa: AAA_URL,
      brentHistory: YAHOO_BRENT_URL,
      regionalGasHistory: 'https://fred.stlouisfed.org/series/APUS12B74714'
    },
    status: complete ? 'live' : 'partial',
    note: complete ? null : `${missing.join(', ')} delayed; the most recent verified values are shown where available.`
  };

  const payload = mergeWithLastGood(fresh, lastGood);
  if (!complete && lastGood) payload.status = 'cached';
  const response = json(payload);
  if (complete) {
    const longCache = json(payload, 200, {'Cache-Control':'public, max-age=900, s-maxage=604800, stale-while-revalidate=2592000'});
    waitUntil(cache.put(lastGoodKey, longCache.clone()));
  }
  waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
