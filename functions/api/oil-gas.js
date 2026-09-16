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
    headers: {'User-Agent': 'MRDHQ classroom energy tracker'},
    signal: AbortSignal.timeout(timeout)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function tableAfter(html, marker) {
  const start = html.indexOf(marker);
  if (start < 0) return '';
  const tableStart = html.indexOf('<table', start);
  const tableEnd = html.indexOf('</table>', tableStart);
  return tableStart >= 0 && tableEnd >= 0 ? html.slice(tableStart, tableEnd + 8) : '';
}

function parseRegularPoints(table) {
  const byLabel = {};
  for (const match of table.matchAll(/<tr[^>]*>[\s\S]*?<td[^>]*>\s*(Current|Yesterday|Week Ago|Month Ago|Year Ago) Avg\.\s*<\/td>\s*<td[^>]*>\s*\$([0-9.]+)\s*<\/td>[\s\S]*?<\/tr>/gi)) {
    byLabel[match[1].replace(/\s+/g, ' ')] = Number(match[2]);
  }
  return LABELS.map(label => ({label, value: byLabel[label]})).filter(point => Number.isFinite(point.value));
}

function parseAAA(html) {
  const pa = parseRegularPoints(tableAfter(html, '<span>Pennsylvania</span> average gas prices'));
  const local = parseRegularPoints(tableAfter(html, 'data-title>Chambersburg-Waynesboro</h3>'));
  if (pa.length !== 5) throw new Error('Pennsylvania comparison table changed');
  return {pa, local};
}

function dashboardValues(data) {
  const row = Array.isArray(data?.energy) ? data.energy.find(item => item.sym === 'BZ=F') : null;
  const price = Number(row?.price);
  const pct = Number(row?.dayPct ?? row?.pct);
  const pa = Number(data?.gas?.pa_regular);
  return {
    brent: Number.isFinite(price) ? {price, pct: Number.isFinite(pct) ? pct : null, source: row?.source || 'Business Dashboard'} : null,
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
  const cacheKey = new Request(`${url.origin}/api/oil-gas?version=2`);
  const lastGoodKey = new Request(`${url.origin}/api/oil-gas?last-good=2`);
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

  const complete = points.pa.length === 5 && dashboard.brent;
  const partial = points.pa.length > 0 || dashboard.brent;
  if (!partial && !lastGood) return json({error: 'Energy data is temporarily unavailable. Use the source links and retry shortly.'}, 503);

  const now = new Date();
  const fresh = {
    updatedAt: now.toISOString(),
    sourceDate: new Intl.DateTimeFormat('en-US', {timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric'}).format(now),
    brent: dashboard.brent,
    pa: points.pa,
    local: points.local,
    sources: {aaa: AAA_URL, dashboard: '/business-dashboard.html'},
    status: complete ? 'live' : 'partial',
    note: complete ? null : 'One source was delayed; the most recent verified values are shown where available.'
  };
  const payload = mergeWithLastGood(fresh, lastGood);
  if (!complete && lastGood) payload.status = 'cached';

  const response = json(payload);
  if (complete) {
    const longCache = json(payload, 200, {'Cache-Control': 'public, max-age=900, s-maxage=604800'});
    waitUntil(cache.put(lastGoodKey, longCache.clone()));
  }
  waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
