/**
 * Stock Market Lab: validation gate for candidate EOD snapshots.
 * Pure JavaScript; no network calls or sheet writes.
 * Feed adapters must provide one row per configured symbol and a trusted
 * market-session date. Do not use the wall-clock date as a substitute.
 */
export function validateSnapshot(candidate, expectedTickers, sessionDate) {
  const expected = new Set(expectedTickers.map(x => String(x).trim().toUpperCase()));
  const seen = new Set();
  const errors = [];
  const rows = Array.isArray(candidate) ? candidate : [];
  for (const row of rows) {
    const symbol = String(row.ticker || '').trim().toUpperCase();
    if (!expected.has(symbol)) errors.push('Unexpected ticker: ' + symbol);
    if (seen.has(symbol)) errors.push('Duplicate ticker: ' + symbol);
    seen.add(symbol);
    const close = Number(row.close);
    const previous = Number(row.previousClose);
    if (!Number.isFinite(close) || close <= 0) errors.push('Invalid close: ' + symbol);
    if (!Number.isFinite(previous) || previous <= 0) errors.push('Invalid previous close: ' + symbol);
    if (row.asOf !== sessionDate) errors.push('Stale/mismatched date: ' + symbol);
  }
  for (const ticker of expected) if (!seen.has(ticker)) errors.push('Missing ticker: ' + ticker);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate || '')) errors.push('Invalid session date');
  return { ok: errors.length === 0, expectedCount: expected.size, receivedCount: rows.length, errors };
}

/**
 * Publish only when validateSnapshot().ok is true, and only if sessionDate
 * is newer than the current published date. Store immutable history keyed
 * by (sessionDate, ticker) to prevent duplicate archives.
 * This module intentionally does NOT overwrite the live sheet.
 */
