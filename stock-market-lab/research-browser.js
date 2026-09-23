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
  const industryGuides={"technology":["software, semiconductors, cloud services and connected devices","product sales, subscriptions, advertising or computing services","product demand, innovation spending, supply chains and competition"],"retail":["stores, e-commerce and consumer shopping","product sales, memberships and marketplace services","customer spending, inventory, shipping costs and margins"],"transport":["vehicles, mobility and transport services","vehicle sales, rides, deliveries and services","production costs, fuel, battery supply and demand"],"food":["food, beverages and restaurant experiences","product sales, restaurant visits and distribution","ingredient costs, pricing, brand loyalty and customer traffic"],"media":["entertainment, content and communications","subscriptions, advertising, licensing and ticket sales","audience demand, content spending and retention"],"finance":["banking, payments and financial services","fees, lending, interest and transaction services","interest rates, credit risk and regulation"],"health":["medicines, medical devices and healthcare services","products, care and insurer payments","clinical studies, approvals, patents and reimbursement"],"energy":["energy production and infrastructure","energy sales, projects and supply contracts","commodity prices, demand and project costs"],"brands":["apparel, beauty and consumer brands","product sales and distribution","brand demand, marketing costs and inventory"],"housing":["construction, property and industrial products","projects, materials, rentals and services","borrowing costs, housing demand and input prices"],"defense":["aerospace and defense products and services","government and commercial contracts","order backlog, contracts and supply chains"]};
  const officialSites={"AAPL":"apple.com","MSFT":"microsoft.com","NVDA":"nvidia.com","AMD":"amd.com","DELL":"dell.com","INTC":"intel.com","ADBE":"adobe.com","CRM":"salesforce.com","GOOGL":"about.google","META":"about.meta.com","AVGO":"broadcom.com","ORCL":"oracle.com","MU":"micron.com","PLTR":"palantir.com","CSCO":"cisco.com","QCOM":"qualcomm.com","IBM":"ibm.com","NOW":"servicenow.com","SNOW":"snowflake.com","TSM":"tsmc.com","CRWD":"crowdstrike.com","PANW":"paloaltonetworks.com","AMZN":"amazon.com","WMT":"corporate.walmart.com","TGT":"corporate.target.com","COST":"costco.com","HD":"homedepot.com","LOW":"lowes.com","EBAY":"ebay.com","ETSY":"etsy.com","BABA":"alibabagroup.com","TSLA":"tesla.com","F":"ford.com","GM":"gm.com","TM":"global.toyota","UBER":"uber.com","LYFT":"lyft.com","RIVN":"rivian.com","RACE":"ferrari.com","KO":"coca-colacompany.com","PEP":"pepsico.com","MCD":"corporate.mcdonalds.com","SBUX":"starbucks.com","CMG":"chipotle.com","DPZ":"dominos.com","YUM":"yum.com","MNST":"monsterbevcorp.com","CAVA":"cava.com","DASH":"doordash.com","HSY":"thehersheycompany.com","NKE":"nike.com","DIS":"thewaltdisneycompany.com","NFLX":"about.netflix.com","SPOT":"spotify.com","PYPL":"paypal.com","V":"visa.com","MA":"mastercard.com","JPM":"jpmorganchase.com","BAC":"bankofamerica.com","PFE":"pfizer.com","JNJ":"jnj.com","UNH":"unitedhealthgroup.com","XOM":"corporate.exxonmobil.com","CVX":"chevron.com","GEV":"gevernova.com"};
  const companyHighlights={"AAPL":"iPhone, Mac, iPad and services","NVDA":"AI accelerators and graphics processors","MSFT":"Windows, Microsoft 365 and Azure","TSLA":"electric vehicles and energy storage","AMZN":"online retail, AWS and advertising","GOOGL":"Search, YouTube and cloud services","META":"social platforms and advertising","PLTR":"data analytics software","KO":"beverage brands","MCD":"franchised and company-operated restaurants","DIS":"entertainment, streaming and theme parks","NFLX":"subscription entertainment","JPM":"banking and asset management","V":"payment networks","PFE":"medicines and vaccines","XOM":"oil, natural gas and refining"};
  function passportBackground(c){
    const industry=c.industries.find(i=>!i.optional)||c.industries[0],g=industryGuides[industry.id]||["products and services","sales and services","customer demand and costs"];
    const overview=companyHighlights[c.ticker]?c.name+" is known for "+companyHighlights[c.ticker]+".":c.name+" participates in "+industry.name.toLowerCase()+", including "+g[0]+".";
    return '<div class="passport-background"><h4>Business overview</h4><p>'+esc(overview)+'</p><h4>How the business earns revenue</h4><p>Businesses in this industry commonly earn money through '+esc(g[1])+'. Check the company’s latest report for its actual revenue breakdown.</p><h4>What to watch</h4><p>Research '+esc(g[2])+'. Compare the company with a competitor and identify a risk and an opportunity.</p><h4>Student research checklist</h4><ul><li>What does the company sell, and who pays for it?</li><li>Who is a direct competitor?</li><li>What do its latest revenue and profit figures show?</li><li>What could change demand or costs?</li></ul><p class="passport-disclaimer">Introductory company and industry context, not a verified current financial report. Use the official website and filings for company-specific figures.</p></div>';
  }
  function companyWebsite(c){const domain=officialSites[c.ticker];return domain?'<a href="https://'+domain+'/" target="_blank" rel="noopener noreferrer">Official company website ↗</a>':'<a href="https://www.google.com/search?q='+encodeURIComponent(c.name+' '+c.ticker+' official website')+'" target="_blank" rel="noopener noreferrer">Find official website ↗</a>';}
  function card(c){
    const m=marketPrices[c.ticker]||{},valid=Number(m.price)>0,pct=Number(m.changePercent);
    const prior=Number(m.previousClose),delta=Number(m.change);
    const movement=valid&&Number.isFinite(pct);
    const className=pct>0?"gain":pct<0?"loss":"";
    const label=c.industries.map(i=>i.name).join(" · ");
    const open=expanded===c.ticker;
    const assigned=Object.values(state.holdings||{}).some(h=>h.ticker===c.ticker);
    return '<article class="stock-card'+(open?' expanded':'')+'"><div class="stock-card-top"><div><span class="stock-symbol">'+esc(c.ticker)+'</span>'+(assigned?'<span class="owned-chip">In your portfolio</span>':'')+'</div><span class="stock-date">'+esc(m.asOf||marketMeta.asOf||"Awaiting data")+'</span></div><h3>'+esc(c.name)+'</h3><p class="stock-sector">'+esc(label)+'</p><div class="stock-price-line"><strong>'+ (valid?fmt(m.price):"Price unavailable")+'</strong><span class="'+className+'">'+(movement?(pct>0?"+":"")+pct.toFixed(2)+"%":"No verified change")+'</span></div><div class="stock-card-metrics"><div><small>Previous close</small><b>'+(prior>0?fmt(prior):"—")+'</b></div><div><small>Day change</small><b class="'+className+'">'+(Number.isFinite(delta)&&valid?(delta>0?"+":"")+fmt(delta):"—")+'</b></div></div><div class="stock-card-actions"><button type="button" class="secondary" data-research="'+esc(c.ticker)+'" aria-expanded="'+open+'">'+(open?"Close passport":"Company passport")+'</button></div>'+(open?'<div class="stock-passport"><p class="eyebrow">COMPANY PASSPORT</p><div class="passport-facts"><div><small>Company</small><strong>'+esc(c.name)+'</strong></div><div><small>Ticker</small><strong>'+esc(c.ticker)+'</strong></div><div><small>Market data</small><strong>'+esc(m.source||marketMeta.source||"Awaiting Sheet")+'</strong></div><div><small>As of</small><strong>'+esc(m.asOf||marketMeta.asOf||"—")+'</strong></div></div>'+passportBackground(c)+'<div class="stock-links">'+companyWebsite(c)+'<a href="https://www.google.com/search?q='+encodeURIComponent(c.ticker+" "+c.name+" stock investor relations")" target="_blank" rel="noopener noreferrer">Research ticker ↗</a><a href="https://www.sec.gov/edgar/search/#/q='+encodeURIComponent(c.name)+'" target="_blank" rel="noopener noreferrer">SEC filings ↗</a></div><p class="stock-footnote">Market prices are the latest available completed close, not live quotes. Check the listing exchange when researching externally.</p><button type="button" class="primary" data-rpick="'+esc(c.industries.find(i=>!i.optional)?.id||c.industries[0].id)+'" '+(window.STOCK_LAB_TRADING_ENABLED===true?"":"disabled")+'>'+(window.STOCK_LAB_TRADING_ENABLED===true?"Compare / Choose":"Portfolio selections not yet open")+'</button></div>':'')+'</article>';
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
