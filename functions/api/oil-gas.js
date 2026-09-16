const AAA_URL = 'https://gasprices.aaa.com/?state=PA';
const DASHBOARD_URL = 'https://script.google.com/macros/s/AKfycbyooLV-6a4MoMv0D-96n2httwe4PwjA3lfTbQqw5jwXtJreLJClEaaeq2VIl46CqXyG/exec';
const YAHOO_BRENT_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/BZ%3DF?range=1y&interval=1d&includePrePost=false&events=div%2Csplits';
const LABELS = ['Year Ago', 'Month Ago', 'Week Ago', 'Yesterday', 'Current'];

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

async function fetchText(url, timeout = 18000) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'MRDHQ classroom energy tracker',
      'Accept': 'text/html,application/xhtml+xml,application/json'
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
    const canonical = LABELS.find(label => label.toLowerCase() === match[1].toLowerCase());
    const value = Number(match[2]);
    if (canonical && Number.isFinite(value)) byLabel[canonical] = value;
  }
  return LABELS.map(label => ({label, value: byLabel[label]})).filter(point => Number.isFinite(point.value));
}

function parseAAA(html) {
  const paTable = findSectionTable(html, [
    'Pennsylvania</span> average gas prices',
    'Pennsylvania average gas prices'
  ]);
  const localTable = findSectionTable(html, [
    'Chambersburg-Waynesboro',
    'Chambersburg–Waynesboro'
  ]);
  const pa = parseRegularPoints(paTable);
  const local = parseRegularPoints(localTable);
  if (pa.length !== 5) throw new Error('Pennsylvania comparison table changed');
  return {pa, local};
}

function dashboardValues(data) {
  const row = Array.isArray(data?.energy) ? data.energy.find(item => item.sym === 'BZ=F') : null;
  const price = Number(row?.price);
  const pct = Number(row?.dayPct ?? row?.pct);
  const pa = Number(data?.gas?.pa_regular);
  return {
    brent: Number.isFinite(price) ? {
      price,
      pct: Number.isFinite(pct) ? pct : null,
      source: row?.source || 'Business Dashboard'
    } : null,
    paCurrent: Number.isFinite(pa) ? pa : null,
    dashboardUpdatedAt: data?.updatedAt || null
  };
}

function nearestTradingValue(rows, targetMs) {
  if (!rows.length) return null;
  let best = null;
  let bestDistance = Infinity;
  for (const row of rows) {
    const distance = Math.abs(row.time - targetMs);
    if (distance < bestDistance) {
      best = row;
      bestDistance = distance;
    }
  }
  return best;
}

function parseBrentHistory(data, currentPrice) {
  const result = data?.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const closes = result?.indicators?.quote?.[0]?.close || [];
  const rows = timestamps.map((ts, i) => ({time: Number(ts) * 1000, value: Number(closes[i])}))
    .filter(row => Number.isFinite(row.time) && Number.isFinite(row.value));
  if (!rows.length) return [];

  const now = Date.now();
  const DAY = 86400000;
  const targets = [
    {label: 'Year Ago', time: now - 365 * DAY},
    {label: 'Month Ago', time: now - 30 * DAY},
    {label: 'Week Ago', time: now - 7 * DAY},
    {label: 'Yesterday', time: now - 1 * DAY}
  ];
  const points = targets.map(target => {
    const row = nearestTradingValue(rows, target.time);
    return row ? {label: target.label, value: row.value} : null;
  }).filter(Boolean);
  const latest = Number.isFinite(currentPrice) ? currentPrice : rows[rows.length - 1].value;
  if (Number.isFinite(latest)) points.push({label: 'Current', value: latest});
  return points;
}

function mergeWithLastGood(fresh, lastGood) {
  return {
    updatedAt: fresh.updatedAt,
    sourceDate: fresh.sourceDate || lastGood?.sourceDate || null,
    brent: fresh.brent || lastGood?.brent || null,
    brentHistory: fresh.brentHistory?.length ? fresh.brentHistory : lastGood?.brentHistory || [],
    pa: fresh.pa?.length ? fresh.pa : lastGood?.pa || [],
    local: fresh.local?.length ? fresh.local : lastGood?.local || [],
    sources: fresh.sources,
    status: fresh.status,
    note: fresh.note || null
  };
}

export async function onRequestGet({request, waitUntil}) {
  const url = new URL(request.url);
  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}/api/oil-gas?version=4`);
  const lastGoodKey = new Request(`${url.origin}/api/oil-gas?last-good=4`);
  const cached = await cache.match(cacheKey);
  if (cached && url.searchParams.get('refresh') !== '1') return cached;

  const [aaaResult, dashboardResult, brentHistoryResult, lastGoodResponse] = await Promise.allSettled([
    fetchText(AAA_URL),
    fetchText(`${DASHBOARD_URL}?oilGas=1&t=${Date.now()}`, 24000).then(JSON.parse),
    fetchText(YAHOO_BRENT_URL, 18000).then(JSON.parse),
    cache.match(lastGoodKey)
  ]);

  let points = {pa: [], local: []};
  let dashboard = {brent: null, paCurrent: null, dashboardUpdatedAt: null};

  if (aaaResult.status === 'fulfilled') {
    try { points = parseAAA(aaaResult.value); } catch {}
  }
  if (dashboardResult.status === 'fulfilled') {
    try { dashboard = dashboardValues(dashboardResult.value); } catch {}
  }
  const brentHistory = brentHistoryResult.status === 'fulfilled'
    ? parseBrentHistory(brentHistoryResult.value, dashboard.brent?.price)
    : [];

  if (!points.pa.length && Number.isFinite(dashboard.paCurrent)) {
    points.pa = [{label: 'Current', value: dashboard.paCurrent}];
  }

  let lastGood = null;
  if (lastGoodResponse.status === 'fulfilled' && lastGoodResponse.value) {
    try { lastGood = await lastGoodResponse.value.json(); } catch {}
  }

  const hasFullPA = points.pa.length === 5;
  const hasFullLocal = points.local.length === 5;
  const hasBrent = Boolean(dashboard.brent);
  const hasBrentHistory = brentHistory.length === 5;
  const complete = hasFullPA && hasFullLocal && hasBrent && hasBrentHistory;
  const partial = points.pa.length > 0 || points.local.length > 0 || hasBrent || brentHistory.length > 0;

  if (!partial && !lastGood) {
    return json({error: 'Energy data is temporarily unavailable. Use the source links and retry shortly.'}, 503);
  }

  const now = new Date();
  const missing = [];
  if (!hasBrent) missing.push('Brent');
  if (!hasBrentHistory) missing.push('Brent history');
  if (!hasFullPA) missing.push('PA comparison points');
  if (!hasFullLocal) missing.push('Chambersburg comparison points');

  const fresh = {
    updatedAt: now.toISOString(),
    sourceDate: new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric'
    }).format(now),
    brent: dashboard.brent,
    brentHistory,
    pa: points.pa,
    local: points.local,
    sources: {aaa: AAA_URL, dashboard: '/business-dashboard.html', brentHistory: YAHOO_BRENT_URL},
    status: complete ? 'live' : 'partial',
    note: complete ? null : `${missing.join(', ')} delayed; the most recent verified values are shown where available.`
  };

  const payload = mergeWithLastGood(fresh, lastGood);
  if (!complete && lastGood) payload.status = 'cached';

  const response = json(payload);
  if (complete) {
    const longCache = json(payload, 200, {'Cache-Control': 'public, max-age=900, s-maxage=604800, stale-while-revalidate=2592000'});
    waitUntil(cache.put(lastGoodKey, longCache.clone()));
  }
  waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
