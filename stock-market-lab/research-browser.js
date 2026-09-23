/* MRDHQ Stock Lab research browser: all 185 unique companies, read-only while trading is closed. */
(function(){
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fmt=n=>Number.isFinite(Number(n))?money(Number(n)):"Awaiting close";
  let filter="all",query="",sort="name",expanded=null;
  const unique=new Map();
  I.forEach(ind=>ind.companies.forEach(c=>{
    if(!unique.has(c.ticker))unique.set(c.ticker,{...c,industries:[]});
    unique.get(c.ticker).industries.push(ind);
  }));
  const universe=[...unique.values()];
  const panel=document.getElementById("researchGrid");
  if(!panel)return;
  const controls=document.getElementById("researchControls");
  const category=document.getElementById("researchIndustry");
  if(controls&&category){
    category.innerHTML='<option value="all">All industries</option>'+I.map(i=>'<option value="'+esc(i.id)+'">'+esc(i.name)+(i.optional?" · Optional research":"")+'</option>').join("");
    document.getElementById("researchSearch").addEventListener("input",e=>{query=e.target.value.trim().toLowerCase();draw()});
    category.addEventListener("change",e=>{filter=e.target.value;draw()});
    document.getElementById("researchSort").addEventListener("change",e=>{sort=e.target.value;draw()});
  }
  function card(c){
    const m=marketPrices[c.ticker]||{},valid=Number(m.price)>0,pct=Number(m.changePercent);
    const prior=Number(m.previousClose),delta=Number(m.change);
    const movement=valid&&Number.isFinite(pct);
    const className=pct>0?"gain":pct<0?"loss":"";
    const label=c.industries.map(i=>i.name).join(" · ");
    const open=expanded===c.ticker;
    const assigned=Object.values(state.holdings||{}).some(h=>h.ticker===c.ticker);
    return '<article class="stock-card'+(open?' expanded':'')+'"><div class="stock-card-top"><div><span class="stock-symbol">'+esc(c.ticker)+'</span>'+(assigned?'<span class="owned-chip">In your portfolio</span>':'')+'</div><span class="stock-date">'+esc(m.asOf||marketMeta.asOf||"Awaiting data")+'</span></div><h3>'+esc(c.name)+'</h3><p class="stock-sector">'+esc(label)+'</p><div class="stock-price-line"><strong>'+ (valid?fmt(m.price):"Price unavailable")+'</strong><span class="'+className+'">'+(movement?(pct>0?"+":"")+pct.toFixed(2)+"%":"No verified change")+'</span></div><div class="stock-card-metrics"><div><small>Previous close</small><b>'+(prior>0?fmt(prior):"—")+'</b></div><div><small>Day change</small><b class="'+className+'">'+(Number.isFinite(delta)&&valid?(delta>0?"+":"")+fmt(delta):"—")+'</b></div></div><div class="stock-card-actions"><button type="button" class="secondary" data-research="'+esc(c.ticker)+'" aria-expanded="'+open+'">'+(open?"Close passport":"Company passport")+'</button></div>'+(open?'<div class="stock-passport"><p class="eyebrow">COMPANY PASSPORT</p><div class="passport-facts"><div><small>Company</small><strong>'+esc(c.name)+'</strong></div><div><small>Ticker</small><strong>'+esc(c.ticker)+'</strong></div><div><small>Market data</small><strong>'+esc(m.source||marketMeta.source||"Awaiting Sheet")+'</strong></div><div><small>As of</small><strong>'+esc(m.asOf||marketMeta.asOf||"—")+'</strong></div></div><p><strong>Research prompts:</strong> What does this company sell? Who pays it? What competitors or costs matter? What recent development might affect demand?</p><div class="stock-links"><a href="https://www.google.com/search?q='+encodeURIComponent(c.ticker+" "+c.name+" stock investor relations")" target="_blank" rel="noopener noreferrer">Research ticker ↗</a><a href="https://www.sec.gov/edgar/search/#/q='+encodeURIComponent(c.name)+'" target="_blank" rel="noopener noreferrer">SEC filings ↗</a></div><p class="stock-footnote">Market prices are the latest available completed close, not live quotes. Check the listing exchange when researching externally.</p><button type="button" class="primary" data-rpick="'+esc(c.industries.find(i=>!i.optional)?.id||c.industries[0].id)+'" '+(window.STOCK_LAB_TRADING_ENABLED===true?"":"disabled")+'>'+(window.STOCK_LAB_TRADING_ENABLED===true?"Compare / Choose":"Portfolio selections not yet open")+'</button></div>':'')+'</article>';
  }
  function draw(){
    let rows=universe.filter(c=>(filter==="all"||c.industries.some(i=>i.id===filter))&&(!query||[c.name,c.ticker,...c.industries.map(i=>i.name)].join(" ").toLowerCase().includes(query)));
    if(sort==="ticker")rows.sort((a,b)=>a.ticker.localeCompare(b.ticker));
    else if(sort==="move")rows.sort((a,b)=>(marketPrices[b.ticker]?.changePercent??-Infinity)-(marketPrices[a.ticker]?.changePercent??-Infinity));
    else if(sort==="price")rows.sort((a,b)=>(marketPrices[b.ticker]?.price??-Infinity)-(marketPrices[a.ticker]?.price??-Infinity));
    else rows.sort((a,b)=>a.name.localeCompare(b.name));
    const count=document.getElementById("researchCount");if(count)count.textContent=rows.length+" of "+universe.length+" companies";
    panel.innerHTML=rows.map(card).join("")||'<div class="research-empty">No companies match. Try another industry or search term.</div>';
  }
  panel.addEventListener("click",e=>{
    const button=e.target.closest("[data-research],[data-rpick]");if(!button)return;
    if(button.dataset.research){expanded=expanded===button.dataset.research?null:button.dataset.research;draw()}
    else if(button.dataset.rpick)openPicker(button.dataset.rpick);
  });
  renderResearch=draw;
  draw();
})();
