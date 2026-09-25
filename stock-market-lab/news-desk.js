/* Lightweight, read-only publisher RSS headlines for the Stock Lab. */
(function(){
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const sources=[
    {name:"CNBC · Business",url:"https://www.cnbc.com/id/10001147/device/rss/rss.html"},
    {name:"CNBC · Earnings",url:"https://www.cnbc.com/id/15839135/device/rss/rss.html"},
    {name:"CNBC · Technology",url:"https://www.cnbc.com/id/19854910/device/rss/rss.html"},
    {name:"NPR · Business",url:"https://feeds.npr.org/1006/rss.xml"},
    {name:"Federal Reserve · Announcements",url:"https://www.federalreserve.gov/feeds/press_all.xml"}
  ];
  const cache=new Map();let request=0,lastLoaded=0;
  const text=(node,tag)=>node.querySelector(tag)?.textContent?.trim()||"";
  function parse(xml,source){
    const doc=new DOMParser().parseFromString(xml,"text/xml");
    if(doc.querySelector("parsererror"))throw Error("Invalid RSS response");
    return [...doc.querySelectorAll("item")].slice(0,18).map(n=>({
      title:text(n,"title"),url:text(n,"link"),date:text(n,"pubDate"),source
    })).filter(n=>n.title&&/^https:\/\//i.test(n.url));
  }
  async function getFeed(source,force){
    const cached=cache.get(source.url);
    if(!force&&cached&&Date.now()-cached.at<600000)return cached.items;
    // Publisher RSS stays the source. Public readers only bridge cross-origin XML.
    const proxies=[
      "https://api.allorigins.win/raw?url="+encodeURIComponent(source.url),
      "https://api.rss2json.com/v1/api.json?rss_url="+encodeURIComponent(source.url)
    ];
    let error;
    for(const proxy of proxies){
      try{
        const response=await fetch(proxy,{signal:AbortSignal.timeout(10000)});
        if(!response.ok)throw Error("RSS bridge unavailable");
        const raw=await response.text();
        let items;
        if(raw.trim().startsWith("{")){
          const json=JSON.parse(raw);
          if(json.status!=="ok")throw Error("RSS bridge returned no feed");
          items=(json.items||[]).slice(0,18).map(n=>({title:n.title||"",url:n.link||"",date:n.pubDate||"",source:source.name})).filter(n=>n.title&&/^https:\/\//i.test(n.url));
        }else items=parse(raw,source.name);
        if(!items.length)throw Error("Empty feed");
        cache.set(source.url,{at:Date.now(),items});
        return items;
      }catch(e){error=e}
    }
    if(cached)return cached.items; // Keep existing headlines if a later refresh fails.
    throw error||Error("Feed unavailable");
  }
  async function load(force=false){
    const status=$("newsStatus"),area=$("newsArticles");
    if(!status||!area)return;
    if(!force&&lastLoaded&&Date.now()-lastLoaded<600000)return;
    const id=++request;drawNewsCharts();status.textContent="Loading publisher headlines…";
    const results=await Promise.allSettled(sources.map(source=>getFeed(source,force)));
    if(id!==request)return;
    const available=results.filter(r=>r.status==="fulfilled").length;
    lastLoaded=Date.now();
    status.textContent=available+"/"+sources.length+" sources · five headlines per source · checked "+new Date().toLocaleTimeString();
    area.innerHTML=sources.map((source,i)=>{
      const result=results[i];
      if(result.status!=="fulfilled")return '<section class="stock-card" style="grid-column:1/-1"><h2>'+esc(source.name)+'</h2><p>Feed temporarily unavailable.</p><a href="'+esc(source.url)+'" target="_blank" rel="noopener noreferrer">Open publisher RSS ↗</a></section>';
      const items=result.value.slice().sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0)).slice(0,5);
      return '<section class="stock-card" style="grid-column:1/-1"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><h2>'+esc(source.name)+'</h2><a href="'+esc(source.url)+'" target="_blank" rel="noopener noreferrer">Publisher RSS ↗</a></div><div style="display:grid;gap:12px;margin-top:12px">'+items.map((story,index)=>{
        const d=Date.parse(story.date),date=Number.isFinite(d)?new Date(d).toLocaleDateString():"Date unavailable";
        return '<article style="padding:12px 0;border-top:1px solid rgba(140,160,185,.25)"><p class="eyebrow">'+(index+1)+' · '+esc(date)+'</p><h3 style="margin:6px 0 8px">'+esc(story.title)+'</h3><a href="'+esc(story.url)+'" target="_blank" rel="noopener noreferrer">Read original story ↗</a></article>';
      }).join("")+'</div></section>';
    }).join("");
    drawNewsCharts();
  }
  function drawNewsCharts(){
    const holder=$("newsCharts");if(!holder)return;
    const found=new Map();
    I.forEach(ind=>ind.companies.forEach(c=>{
      const quote=marketPrices[c.ticker],pct=Number(quote?.changePercent);
      if(quote?.price>0&&Number.isFinite(pct))found.set(c.ticker,{ticker:c.ticker,pct});
    }));
    const values=[...found.values()];
    const make=(title,rows)=>{
      const max=Math.max(1,...rows.map(x=>Math.abs(x.pct)));
      return '<section class="stock-card"><h3>'+title+'</h3>'+ (rows.length?rows.map(x=>
        '<div style="display:grid;grid-template-columns:62px 1fr 76px;gap:10px;align-items:center;margin:12px 0"><strong>'+esc(x.ticker)+'</strong><div style="background:rgba(140,160,185,.18);border-radius:6px;height:12px;overflow:hidden"><div style="height:100%;width:'+(Math.abs(x.pct)/max*100).toFixed(1)+'%;background:'+(x.pct>=0?'#25aa84':'#e06774')+'"></div></div><strong class="'+(x.pct>=0?'gain':'loss')+'">'+(x.pct>=0?'+':'')+x.pct.toFixed(2)+'%</strong></div>'
      ).join(""):'<p>Waiting for a completed market snapshot.</p>')+'</section>';
    };
    holder.innerHTML=make('Largest gains',values.filter(x=>x.pct>0).sort((a,b)=>b.pct-a.pct).slice(0,5))+make('Largest declines',values.filter(x=>x.pct<0).sort((a,b)=>a.pct-b.pct).slice(0,5));
    const stamp=$("newsChartDate");if(stamp)stamp.textContent=marketMeta?.asOf?'Market snapshot: '+new Date(marketMeta.asOf).toLocaleString():'Market snapshot pending';
  }
  $("newsRefresh")?.addEventListener("click",()=>load(true));
  window.STOCK_LAB_LOAD_NEWS=()=>load();
  // Only refresh on the news tab; no persistent background requests.
  setInterval(()=>{if($("news")?.classList.contains("active")&&!document.hidden)load()},60000);
})();