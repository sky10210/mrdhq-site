#!/usr/bin/env python3
"""Stock Lab daily valuation. Requires STOCK_LAB_FIREBASE_SERVICE_ACCOUNT_JSON secret."""
import json, os, re, urllib.request
from datetime import datetime, timezone
from google.cloud import firestore
from google.oauth2 import service_account

PROJECT="mrdhq-stock-market-lab"
FEED="https://script.google.com/macros/s/AKfycbw9g6vKH9fgVjzlefmd6tywOPRek1RdHtWiZEpdiflS4sjFlR352_vz62VYBW00CNx7/exec"
def main():
    secret=os.environ.get("STOCK_LAB_FIREBASE_SERVICE_ACCOUNT_JSON")
    if not secret: raise SystemExit("Missing STOCK_LAB_FIREBASE_SERVICE_ACCOUNT_JSON. No snapshots written.")
    credentials=service_account.Credentials.from_service_account_info(json.loads(secret))
    db=firestore.Client(project=PROJECT,credentials=credentials)
    with urllib.request.urlopen(FEED,timeout=40) as response: body=response.read().decode("utf-8")
    match=re.fullmatch(r"\s*stockLabReceiveMarket\((\{.*\})\);?\s*",body,re.S)
    if not match: raise SystemExit("Invalid Sheet feed; no snapshots written.")
    feed=json.loads(match.group(1))
    prices=feed.get("prices",{})
    asof=feed.get("asOf","")
    if not feed.get("success") or len(prices)<180 or not re.fullmatch(r"\d{4}-\d{2}-\d{2}",asof):
        raise SystemExit("Incomplete market data; no snapshots written.")
    if (datetime.now(timezone.utc).date()-datetime.strptime(asof,"%Y-%m-%d").date()).days>5:
        raise SystemExit("Stale market data; no snapshots written.")
    count=0
    required=("technology","retail","transport","food","media","finance","health","energy","brands","housing")
    for doc in db.collection("stockLabUsers").stream():
        data=doc.to_dict() or {}
        holdings=data.get("holdings") or {}
        total=15000.0*sum(1 for x in required if x not in holdings)
        for industry,holding in holdings.items():
            if industry not in required: continue
            ticker=holding.get("ticker","")
            market=prices.get(ticker)
            if not market or float(market.get("price",0))<=0:
                raise SystemExit(f"Missing market price for {ticker}; stopped before further updates.")
            total+=float(holding.get("shares",0))*float(market["price"])
        history=[x for x in (data.get("history") or []) if x.get("day")!=asof]
        history.append({"day":asof,"value":round(total,2)})
        history=sorted(history,key=lambda x:x["day"])[-180:]
        doc.reference.update({"history":history,"lastValuationDate":asof,"lastValuation":round(total,2)})
        db.collection("stockLabDailySnapshots").document(asof).collection("students").document(doc.id).set({"uid":doc.id,"value":round(total,2),"asOf":asof,"holdingsCount":len(holdings)},merge=True)
        count+=1
    print(f"Valued {count} portfolios using {len(prices)} Sheet prices as of {asof}.")
if __name__=="__main__": main()
