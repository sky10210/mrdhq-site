const AAA_URL = 'https://gasprices.aaa.com/?state=PA';
const YAHOO_BRENT_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/BZ%3DF?range=10y&interval=1d&includePrePost=false&events=div%2Csplits';
const DASHBOARD_URL = 'https://script.google.com/macros/s/AKfycbyooLV-6a4MoMv0D-96n2httwe4PwjA3lfTbQqw5jwXtJreLJClEaaeq2VIl46CqXyG/exec';
const SHORT_LABELS = ['Year Ago', 'Month Ago', 'Week Ago', 'Yesterday', 'Current'];
const DAY = 86400000;

const HEATING_OIL_HISTORY = [
  {date:'2025-12-01',value:3.449},{date:'2025-12-08',value:3.436},{date:'2025-12-15',value:3.392},{date:'2025-12-22',value:3.357},{date:'2025-12-29',value:3.355},
  {date:'2026-01-05',value:3.348},{date:'2026-01-12',value:3.328},{date:'2026-01-19',value:3.363},{date:'2026-01-26',value:3.592},
  {date:'2026-02-02',value:3.853},{date:'2026-02-09',value:3.889},{date:'2026-02-16',value:3.909},{date:'2026-02-23',value:3.912},
  {date:'2026-03-02',value:4.065},{date:'2026-03-09',value:4.769},{date:'2026-03-16',value:4.835},{date:'2026-03-23',value:5.198},{date:'2026-03-30',value:5.160}
];

// Last verified classroom snapshot. These values are used only if a live source is temporarily unreachable.
const FALLBACK_PA = [
  {label:'Year Ago',value:3.33},{label:'Month Ago',value:4.0777},{label:'Week Ago',value:4.30},{label:'Yesterday',value:4.4987},{label:'Current',value:4.4987}
];
const FALLBACK_LOCAL = [
  {label:'Year Ago',value:3.19},{label:'Month Ago',value:3.9596},{label:'Week Ago',value:4.08},{label:'Yesterday',value:4.23},{label:'Current',value:4.2357}
];
const FALLBACK_BRENT = {price:102.67,date:'2026-09-15',latestClose:102.67,latestDate:'2026-09-15',source:'Verified classroom snapshot'};

const administrations = [
  {start:'2017-01-20',end:'2021-01-20',label:'Trump'},
  {start:'2021-01-20',end:'2025-01-20',label:'Biden'},
  {start:'2025-01-20',end:null,label:'Trump'}
];

const events = [
  {date:'2020-03-11',title:'COVID-19 demand shock',detail:'Travel and economic activity fell sharply, cutting fuel demand and creating extreme oil-market volatility.',kind:'demand'},
  {date:'2022-02-24',title:'Russia invades Ukraine',detail:'The invasion and sanctions disrupted global energy trade and increased uncertainty around supply.',kind:'geopolitical'},
  {date:'2023-04-02',title:'OPEC+ announces additional cuts',detail:'Major producers announced voluntary output cuts, tightening expected supply.',kind:'supply'},
  {date:'2026-02-28',title:'Iran conflict escalates',detail:'Conflict raised risks to Middle East production and shipping through the Strait of Hormuz.',kind:'geopolitical'},
  {date:'2026-09-11',title:'Saudi East-West pipeline attacked',detail:'A major Saudi export route was disrupted, increasing concern about crude supply and shipping capacity.',kind:'supply'},
  {date:'2026-09-15',title:'Yanbu loadings disrupted',detail:'Reduced loadings increased concern about available replacement crude supplies.',kind:'supply'}
];

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'public, max-age=300, s-maxage=1800, stale-while-revalidate=86400',
    'Access-Control-Allow-Origin':'*',
    'X-Content-Type-Options':'nosniff',
    ...headers
  }
});

async function fetchText(url, timeout = 18000) {
  const response = await fetch(url, {
    headers:{'User-Agent':'MRDHQ classroom energy tracker','Accept':'text/html,application/xhtml+xml,application/json,*/*'},
    signal:AbortSignal.timeout(timeout)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function decodeText(value='') {
  return value.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&#8211;|&ndash;/gi,'–').replace(/\s+/g,' ').trim();
}
function tableAfterText(html,needle){const lower=html.toLowerCase(),start=lower.indexOf(needle.toLowerCase());if(start<0)return'';const ts=lower.indexOf('<table',start),te=lower.indexOf('</table>',ts);return ts>=0&&te>=0?html.slice(ts,te+8):''}
function findSectionTable(html,names){for(const name of names){const table=tableAfterText(html,name);if(table)return table}return''}
function parseRegularPoints(table){if(!table)return[];const byLabel={};for(const row of table.match(/<tr[\s\S]*?<\/tr>/gi)||[]){const text=decodeText(row);const m=text.match(/\b(Current|Yesterday|Week Ago|Month Ago|Year Ago)\s+Avg\.\s*\$?([0-9]+(?:\.[0-9]+)?)/i);if(!m)continue;const label=SHORT_LABELS.find(x=>x.toLowerCase()===m[1].toLowerCase()),value=Number(m[2]);if(label&&Number.isFinite(value))byLabel[label]=value}return SHORT_LABELS.map(label=>({label,value:byLabel[label]})).filter(p=>Number.isFinite(p.value))}
function parseAAA(html){const paTable=findSectionTable(html,['Pennsylvania</span> average gas prices','Pennsylvania average gas prices']);const localTable=findSectionTable(html,['Chambersburg-Waynesboro','Chambersburg–Waynesboro']);return{pa:parseRegularPoints(paTable),local:parseRegularPoints(localTable)}}

function parseBrent(data){
  const result=data?.chart?.result?.[0],timestamps=result?.timestamp||[],closes=result?.indicators?.quote?.[0]?.close||[];
  const rows=timestamps.map((ts,i)=>({date:new Date(Number(ts)*1000).toISOString().slice(0,10),time:Number(ts)*1000,value:Number(closes[i])})).filter(r=>Number.isFinite(r.time)&&Number.isFinite(r.value)&&r.value>10&&r.value<250).sort((a,b)=>a.time-b.time);
  if(!rows.length)return{history:[],latest:null,previous:null};
  const cutoff=Date.now()-6*365.25*DAY,sampled=[];let lastBucket='';
  for(const row of rows.filter(r=>r.time>=cutoff)){const d=new Date(row.time),jan1=new Date(Date.UTC(d.getUTCFullYear(),0,1)),week=Math.floor((row.time-jan1.getTime())/(7*DAY)),bucket=`${d.getUTCFullYear()}-${week}`;if(bucket!==lastBucket){sampled.push({date:row.date,value:Number(row.value.toFixed(2))});lastBucket=bucket}else sampled[sampled.length-1]={date:row.date,value:Number(row.value.toFixed(2))}}
  const latest=rows[rows.length-1],previous=rows.length>1?rows[rows.length-2]:null;
  return{history:sampled,latest:latest?{date:latest.date,value:Number(latest.value.toFixed(2))}:null,previous:previous?{date:previous.date,value:Number(previous.value.toFixed(2))}:null};
}

function dashboardValues(data){const row=Array.isArray(data?.energy)?data.energy.find(x=>x.sym==='BZ=F'):null;const price=Number(row?.price),pa=Number(data?.gas?.pa_regular);return{brent:Number.isFinite(price)?{price,date:data?.updatedAt?.slice?.(0,10)||null,latestClose:price,latestDate:data?.updatedAt?.slice?.(0,10)||null,source:'MRDHQ Business Dashboard'}:null,paCurrent:Number.isFinite(pa)?pa:null}}

export async function onRequestGet({request,waitUntil}){
  const url=new URL(request.url),cache=caches.default;
  const cacheKey=new Request(`${url.origin}/api/oil-gas?version=8`),lastGoodKey=new Request(`${url.origin}/api/oil-gas?last-good=7`);
  const cached=await cache.match(cacheKey);if(cached&&url.searchParams.get('refresh')!=='1')return cached;

  const [aaaResult,brentResult,dashboardResult,lastGoodResult]=await Promise.allSettled([
    fetchText(AAA_URL),
    fetchText(YAHOO_BRENT_URL).then(JSON.parse),
    fetchText(`${DASHBOARD_URL}?oilGas=1&t=${Date.now()}`,24000).then(JSON.parse),
    cache.match(lastGoodKey)
  ]);

  let aaa={pa:[],local:[]};if(aaaResult.status==='fulfilled'){try{aaa=parseAAA(aaaResult.value)}catch{}}
  let brentParsed={history:[],latest:null,previous:null};if(brentResult.status==='fulfilled'){try{brentParsed=parseBrent(brentResult.value)}catch{}}
  let dashboard={brent:null,paCurrent:null};if(dashboardResult.status==='fulfilled'){try{dashboard=dashboardValues(dashboardResult.value)}catch{}}
  let lastGood=null;if(lastGoodResult.status==='fulfilled'&&lastGoodResult.value){try{lastGood=await lastGoodResult.value.json()}catch{}}

  const brent=brentParsed.previous?{price:brentParsed.previous.value,date:brentParsed.previous.date,latestClose:brentParsed.latest?.value??null,latestDate:brentParsed.latest?.date??null,source:'Brent futures close (BZ=F)'}:(dashboard.brent||lastGood?.brent||FALLBACK_BRENT);
  let pa=aaa.pa.length===5?aaa.pa:(lastGood?.pa?.length===5?lastGood.pa:FALLBACK_PA);
  let local=aaa.local.length===5?aaa.local:(lastGood?.local?.length===5?lastGood.local:FALLBACK_LOCAL);
  if(aaa.pa.length!==5&&Number.isFinite(dashboard.paCurrent)){pa=pa.map(p=>p.label==='Current'?{...p,value:dashboard.paCurrent}:p)}
  const brentHistory=brentParsed.history.length>30?brentParsed.history:(lastGood?.brentHistory||[]);

  const sourceState={aaa:aaa.pa.length===5&&aaa.local.length===5,yahoo:brentParsed.history.length>30,dashboard:Boolean(dashboard.brent)};
  const liveCount=Object.values(sourceState).filter(Boolean).length;
  const now=new Date();
  const payload={
    updatedAt:now.toISOString(),
    sourceDate:new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',year:'numeric'}).format(now),
    brent,brentHistory,
    heatingOilHistory:HEATING_OIL_HISTORY,
    heatingOilLatest:{date:'2026-03-30',value:5.160,status:'offseason',nextSeason:'October 2026'},
    pa,local,administrations,events,
    sources:{aaa:AAA_URL,brentHistory:YAHOO_BRENT_URL,dashboard:'/business-dashboard.html',heatingOil:'https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?f=W&n=PET&s=W_EPD2F_PRS_SPA_DPG'},
    status:liveCount===3?'live':liveCount>0?'partial':'fallback',
    note:liveCount===3?null:'One or more outside sources are delayed; verified cached or classroom snapshot values are being used.'
  };

  const response=json(payload);
  if(sourceState.aaa&&sourceState.yahoo){const longCache=json(payload,200,{'Cache-Control':'public, max-age=900, s-maxage=604800, stale-while-revalidate=2592000'});waitUntil(cache.put(new Request(`${url.origin}/api/oil-gas?last-good=8`),longCache.clone()))}
  waitUntil(cache.put(cacheKey,response.clone()));
  return response;
}
