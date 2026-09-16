const AAA_URL = 'https://gasprices.aaa.com/?state=PA';
const DASHBOARD_URL = 'https://script.google.com/macros/s/AKfycbyooLV-6a4MoMv0D-96n2httwe4PwjA3lfTbQqw5jwXtJreLJClEaaeq2VIl46CqXyG/exec';
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
      'Accept': 'text/html,application/xhtml+xml'
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

function mergeWithLastGood(fresh, lastGood) {
  return {
    updatedAt: fresh.updatedAt,
    sourceDate: fresh.sourceDate || lastGood?.sourceDate || null,
    brent: fresh.brent || lastGood?.brent || null,
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
  const cacheKey = new Request(`${url.origin}/api/oil-gas?version=3`);
  const lastGoodKey = new Request(`${url.origin}/api/oil-gas?last-good=3`);
  const cached = await cache.match(cacheKey);
  if (cached && url.searchParams.get('refresh') !== '1') return cached;

  const [aaaResult, dashboardResult, lastGoodResponse] = await Promise.allSettled([
    fetchText(AAA_URL),
    fetchText(`${DASHBOARD_URL}?oilGas=1&t=${Date.now()}`, 24000).then(JSON.parse),
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
  const complete = hasFullPA && hasFullLocal && hasBrent;
  const partial = points.pa.length > 0 || points.local.length > 0 || hasBrent;

  if (!partial && !lastGood) {
    return json({error: 'Energy data is temporarily unavailable. Use the source links and retry shortly.'}, 503);
  }

  const now = new Date();
  const missing = [];
  if (!hasBrent) missing.push('Brent');
  if (!hasFullPA) missing.push('PA comparison points');
  if (!hasFullLocal) missing.push('Chambersburg comparison points');

  const fresh = {
    updatedAt: now.toISOString(),
    sourceDate: new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(now),
    brent: dashboard.brent,
    pa: points.pa,
    local: points.local,
    sources: {aaa: AAA_URL, dashboard: '/business-dashboard.html'},
    status: complete ? 'live' : 'partial',
    note: complete ? null : `${missing.join(', ')} delayed; the most recent verified values are shown where available.`
  };

  const payload = mergeWithLastGood(fresh, lastGood);
  if (!complete && lastGood) payload.status = 'cached';

  const response = json(payload);
  if (complete) {
    const longCache = json(payload, 200, {
      'Cache-Control': 'public, max-age=900, s-maxage=604800, stale-while-revalidate=2592000'
    });
    waitUntil(cache.put(lastGoodKey, longCache.clone()));
  }
  waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
