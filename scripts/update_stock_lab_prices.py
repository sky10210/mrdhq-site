#!/usr/bin/env python3
import csv, io, json, urllib.request, zipfile
from pathlib import Path
from datetime import datetime, timezone
ROOT=Path(__file__).resolve().parents[1]
STOCKS=json.loads((ROOT/"stock-market-lab/stock-list.json").read_text())["stocks"]
WANTED={x["ticker"].upper() for x in STOCKS}
URL="https://static.stooq.com/db/h/d_us_txt.zip"
req=urllib.request.Request(URL,headers={"User-Agent":"MRDHQ-Stock-Market-Lab/1.0 educational classroom"})
with urllib.request.urlopen(req,timeout=120) as r: raw=r.read()
found={}
with zipfile.ZipFile(io.BytesIO(raw)) as z:
  for name in z.namelist():
    if not name.lower().endswith(".txt"): continue
    ticker=Path(name).stem.upper()
    if ticker not in WANTED: continue
    rows=[]
    with z.open(name) as fh:
      text=io.TextIOWrapper(fh,encoding="utf-8",errors="ignore")
      reader=csv.DictReader(text)
      for row in reader:
        try:
          d=row.get("<DATE>") or row.get("Date") or row.get("DATE")
          c=row.get("<CLOSE>") or row.get("Close") or row.get("CLOSE")
          if d and c: rows.append((d,float(c)))
        except (TypeError,ValueError): pass
    rows.sort(key=lambda x:x[0])
    if len(rows)>=2:
      prev,latest=rows[-2],rows[-1]
      change=latest[1]-prev[1]
      found[ticker]={"price":round(latest[1],4),"previousClose":round(prev[1],4),"change":round(change,4),"changePercent":round(change/prev[1]*100,4) if prev[1] else 0,"asOf":latest[0],"previousAsOf":prev[0]}
missing=sorted(WANTED-set(found))
if len(found)<int(len(WANTED)*0.9): raise SystemExit(f"Safety stop: only {len(found)}/{len(WANTED)} tickers found; refusing to publish partial snapshot. Missing: {missing}")
asof=max(v["asOf"] for v in found.values())
payload={"source":"Stooq end-of-day","asOf":asof,"generatedAt":datetime.now(timezone.utc).isoformat(),"count":len(found),"prices":found,"missing":missing}
out="window.STOCK_LAB_MARKET_SNAPSHOT="+json.dumps(payload,separators=(",",":"))+";\n"
(ROOT/"stock-market-lab/market-snapshot.js").write_text(out,encoding="utf-8")
print(f"Wrote {len(found)} prices for {asof}; missing {len(missing)}: {', '.join(missing) or 'none'}")
