/* Lightweight, read-only publisher RSS headlines for the Stock Lab. */
(function(){
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const sources=[
    {name:"CNBC · Business",url:"https://www.cnbc.com/id/10001147/device/rss/rss.html"},
    {name:"CNBC · Earnings",url:"https://www.cnbc.com/id/15839135/device/rss/rss.html"},
    {name:"CNBC · Technology",url:"https://www.cnbc.com/id/19854910/device/rss/rss.html"},
    {name:"NPR · Business",url:"https://feeds.npr.org/1006/rss.xml"}
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
    const id=++request;status.textContent="Loading publisher headlines…";
    const results=await Promise.allSettled(sources.map(source=>getFeed(source,force)));
    if(id!==request)return;
    const stories=results.flatMap(r=>r.status==="fulfilled"?r.value:[]);
    const seen=new Set();
    const items=stories.filter(s=>{const key=s.url.split("?")[0];if(seen.has(key))return false;seen.add(key);return true})
      .sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0)).slice(0,28);
    const failed=results.filter(r=>r.status==="rejected").length;
    if(!items.length){
      status.textContent="Feeds temporarily unavailable";
      area.innerHTML='<article class="stock-card"><h3>Headlines unavailable</h3><p>Open a publisher feed directly or try Refresh later.</p>'+sources.map(s=>'<p><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.name)+' RSS ↗</a></p>').join("")+'</article>';
      return;
    }
    lastLoaded=Date.now();
    status.textContent=items.length+" headlines · "+(sources.length-failed)+"/"+sources.length+" feeds · updated "+new Date().toLocaleTimeString();
    area.innerHTML=items.map(s=>{
      const d=Date.parse(s.date);const date=Number.isFinite(d)?new Date(d).toLocaleDateString():"Date unavailable";
      return '<article class="stock-card"><p class="eyebrow">'+esc(s.source)+' · '+esc(date)+'</p><h3>'+esc(s.title)+'</h3><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">Read original story ↗</a></article>';
    }).join("");
  }
  $("newsRefresh")?.addEventListener("click",()=>load(true));
  window.STOCK_LAB_LOAD_NEWS=()=>load();
  // Only refresh on the news tab; no persistent background requests.
  setInterval(()=>{if($("news")?.classList.contains("active")&&!document.hidden)load()},60000);
})();