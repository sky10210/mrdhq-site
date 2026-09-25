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
  const additionalProfiles={"AAPL":["iPhone, Mac, iPad, wearables and digital services","consumers and organizations","device upgrades, services growth and supply chains"],"MSFT":["Windows, Microsoft 365, Azure and enterprise software","businesses, governments and consumers","cloud demand and recurring subscriptions"],"NVDA":["graphics processors, AI accelerators and computing platforms","data centers, developers and equipment makers","AI infrastructure spending and chip supply"],"AMD":["processors and graphics chips for computers and servers","computer makers and data centers","server chip demand and competition"],"DELL":["personal computers, servers and enterprise infrastructure","businesses, institutions and consumers","PC refresh cycles and AI server orders"],"INTC":["processors and semiconductor manufacturing services","computer makers and data centers","manufacturing investment and chip competition"],"ADBE":["creative, document and marketing software","creators and businesses","subscription retention and product adoption"],"CRM":["customer relationship and enterprise software","businesses","subscription growth and enterprise spending"],"GOOGL":["Search, YouTube, cloud computing and advertising","advertisers, enterprises and consumers","advertising demand and AI competition"],"META":["social platforms, advertising and immersive technology","advertisers and platform users","engagement, ad demand and infrastructure costs"],"AVGO":["semiconductors and infrastructure software","cloud providers and enterprises","custom chip demand and software revenue"],"ORCL":["database, enterprise applications and cloud infrastructure","businesses and governments","cloud capacity and contract backlog"],"MU":["DRAM and NAND memory chips","device makers and data centers","memory pricing and AI demand"],"PLTR":["data integration, analytics and AI software","government agencies and enterprises","software adoption and contracts"],"CSCO":["networking equipment, security and software","enterprises and network operators","network upgrades and subscriptions"],"QCOM":["wireless chips and intellectual-property licensing","device manufacturers","smartphone demand and licensing"],"IBM":["enterprise software, consulting and infrastructure","large organizations and governments","software adoption and consulting demand"],"NOW":["workflow automation and enterprise software","businesses and institutions","subscription growth and customer retention"],"SNOW":["cloud data platform and analytics software","enterprises","data consumption and cloud spending"],"TSM":["contract semiconductor manufacturing","chip designers","advanced-node demand and fabrication capacity"],"CRWD":["endpoint security and threat intelligence software","businesses and governments","cybersecurity spending and subscriptions"],"PANW":["network, cloud and endpoint security platforms","businesses and governments","platform adoption and security budgets"],"AMZN":["e-commerce, AWS cloud and advertising","shoppers, merchants and enterprises","retail margins and cloud growth"],"WMT":["grocery and general merchandise retail","households and marketplace sellers","store traffic and retail margins"],"TGT":["general merchandise and grocery retail","households","discretionary spending and inventory"],"COST":["membership warehouse retail","members and households","membership renewals and merchandise margins"],"HD":["home-improvement products and services","homeowners and contractors","renovation demand and housing activity"],"LOW":["home-improvement retail","homeowners and contractors","repair spending and professional sales"],"EBAY":["online marketplace for goods","buyers and sellers","transaction volume and seller activity"],"ETSY":["marketplace for handmade, vintage and unique goods","buyers and independent sellers","buyer activity and marketplace fees"],"BABA":["e-commerce, cloud and digital services","merchants, consumers and enterprises","commerce demand and cloud adoption"],"TSLA":["electric vehicles, energy storage and related services","vehicle buyers and energy customers","deliveries, pricing and battery costs"],"F":["Ford and Lincoln vehicles and commercial services","drivers and fleet operators","vehicle demand and manufacturing costs"],"GM":["Chevrolet, GMC, Cadillac and other automotive products","drivers and fleet operators","vehicle sales and production costs"],"TM":["Toyota and Lexus vehicles and mobility technology","drivers and fleets","vehicle demand and production efficiency"],"UBER":["ride-hailing, delivery and mobility platform","riders, drivers, merchants and couriers","trip volume and platform economics"],"LYFT":["ride-hailing and mobility services","riders and drivers","ride demand and platform competition"],"RIVN":["electric trucks, SUVs and related technology","vehicle buyers and fleet customers","deliveries and manufacturing scale"],"RACE":["Ferrari luxury sports cars and related products","high-end vehicle buyers","order book and vehicle mix"],"KO":["Coca-Cola and other beverage brands","retailers, restaurants and consumers","pricing, distribution and brand demand"],"PEP":["beverages and convenient foods including snacks","retailers and consumers","snack demand and input costs"],"MCD":["franchised and company-operated fast-food restaurants","franchisees and restaurant guests","same-store sales and franchise economics"],"SBUX":["coffee shops and packaged coffee products","coffee customers and retail partners","customer traffic and store costs"],"CMG":["fast-casual Mexican-inspired restaurants","restaurant guests","traffic, food costs and new locations"],"DPZ":["pizza delivery and carryout restaurants","franchisees and pizza customers","order volume and franchise sales"],"YUM":["restaurant brands including Taco Bell, KFC and Pizza Hut","franchisees and guests","restaurant sales and franchise expansion"],"MNST":["energy drinks and beverage brands","retailers and consumers","distribution and beverage demand"],"CAVA":["Mediterranean fast-casual restaurants and packaged foods","restaurant guests and retailers","new locations and restaurant margins"],"DASH":["delivery marketplace and logistics services","consumers, merchants and couriers","order volume and delivery economics"],"HSY":["chocolate, confectionery and snacks","retailers and consumers","cocoa costs and brand demand"],"DIS":["film, television, streaming, parks and experiences","viewers, visitors and advertisers","content costs and park attendance"],"NFLX":["subscription video entertainment","subscribers","content investment and retention"],"SPOT":["music and audio streaming","listeners and advertisers","subscriber growth and royalties"],"JPM":["consumer and investment banking, payments and asset management","households, businesses and investors","credit quality and interest income"],"BAC":["consumer and commercial banking","households and businesses","deposits, lending and credit losses"],"V":["global electronic payment network","banks and merchants","payment volume and cross-border activity"],"MA":["global payment network and services","banks, merchants and payment users","transaction growth and cross-border spending"],"PYPL":["digital payments and merchant checkout services","shoppers and merchants","payment volume and competition"],"PFE":["prescription medicines and vaccines","patients and healthcare systems","drug demand and patent timelines"],"JNJ":["medicines and medical technology","patients and healthcare providers","product adoption and clinical development"],"UNH":["health insurance and healthcare services","members, employers and patients","medical costs and regulation"],"XOM":["oil, natural gas, refining and chemicals","fuel, chemical and energy buyers","commodity prices and capital spending"],"CVX":["oil, natural gas and energy products","energy and fuel buyers","commodity prices and production"],"NKE":["athletic footwear, apparel and equipment","athletes and consumers","brand demand and inventory"]};
  const detailedProfiles={"SMCI":["AI-oriented servers and data-center systems","enterprise and cloud infrastructure buyers","server orders, margins and component availability"],"SNDK":["flash-memory storage products","device makers, enterprises and consumers","flash demand and memory pricing"],"WDC":["hard drives and data-storage systems","cloud operators and enterprises","storage demand and manufacturing costs"],"STX":["hard disk drives and storage technology","cloud providers and enterprises","data-center storage spending"],"MRVL":["semiconductors for data centers, networking and communications","cloud and equipment manufacturers","custom chip demand and design wins"],"LRCX":["equipment used to manufacture semiconductor chips","chip manufacturers","fabrication investment and export restrictions"],"AMAT":["semiconductor manufacturing equipment and materials engineering","chip and display manufacturers","factory investment and chip demand"],"APP":["software for mobile advertising and app monetization","app developers and advertisers","ad spending and platform policies"],"VRT":["power and cooling infrastructure for data centers","data-center operators and builders","AI infrastructure investment and equipment capacity"],"ANET":["high-speed networking equipment and software","cloud and enterprise networks","data-center network upgrades"],"BBY":["consumer electronics retail","shoppers and electronics brands","device upgrade cycles and retail margins"],"CHWY":["online pet products and services","pet owners","repeat purchases and fulfillment costs"],"MELI":["Latin American e-commerce and financial technology","online shoppers, merchants and payment users","commerce volume and regional conditions"],"ROST":["off-price apparel and home-goods retail","value-oriented shoppers","inventory buying and consumer spending"],"TJX":["off-price apparel and home retail brands","value-oriented shoppers","store traffic and merchandise sourcing"],"DAL":["passenger air transportation","travelers and corporate customers","ticket demand, fuel and labor costs"],"LUV":["passenger air transportation","travelers","ticket pricing, fuel and operating efficiency"],"AAL":["passenger air transportation","travelers and corporate customers","travel demand, debt and fuel"],"UPS":["parcel delivery and logistics","businesses and consumers","shipping volume and labor costs"],"LCID":["premium electric vehicles and technology","vehicle buyers","production scale and cash needs"],"NIO":["electric vehicles and related services","vehicle buyers","deliveries, pricing and battery costs"],"FDX":["express shipping, ground delivery and logistics","businesses and consumers","shipment volume and network costs"],"CVNA":["online used-car retail and financing-related services","used-car buyers and sellers","vehicle margins, financing and inventory"],"SHAK":["fast-casual burgers and restaurant experiences","restaurant guests","new locations and food costs"],"KDP":["coffee, soft drinks and beverage brands","retailers and beverage consumers","brand demand and distribution"],"MDLZ":["snacks and confectionery brands","retailers and snack consumers","cocoa costs and pricing"],"CELH":["energy drinks and beverage brands","retailers and consumers","distribution and category demand"],"BROS":["drive-through coffee and beverage shops","coffee customers","new-store economics and customer traffic"],"TSN":["meat and prepared-food production","retailers and foodservice buyers","livestock costs and processing margins"],"GIS":["packaged foods and cereal brands","grocery retailers and consumers","volume, pricing and ingredient costs"],"KHC":["packaged food and condiment brands","retailers and consumers","brand demand and input costs"],"CPB":["soups, snacks and packaged foods","grocery retailers and consumers","sales volume and commodity costs"],"CAG":["frozen and packaged food brands","grocery retailers and consumers","consumer demand and manufacturing costs"],"WING":["franchised chicken-wing restaurants","franchisees and restaurant guests","same-store sales and chicken costs"],"TXRH":["casual-dining restaurants","restaurant guests","traffic, labor and food costs"],"QSR":["restaurant brands including Burger King and Tim Hortons","franchisees and guests","franchise sales and restaurant expansion"],"SONY":["gaming, music, pictures and electronics","players, viewers, creators and electronics buyers","content releases and hardware demand"],"TTWO":["video game publishing and interactive entertainment","game players","release schedules and player spending"],"CMCSA":["broadband, media and entertainment services","subscribers and advertisers","broadband subscribers and content costs"],"WBD":["film, television and streaming entertainment","subscribers, distributors and advertisers","streaming economics and debt"],"RBLX":["user-created gaming and virtual experiences","players and creators","engagement and virtual purchases"],"PARA":["film, television and streaming brands","audiences, distributors and advertisers","content economics and corporate changes"],"ROKU":["streaming platform, devices and advertising","viewers, advertisers and content partners","platform engagement and ad demand"],"SNAP":["Snapchat social platform and advertising","users and advertisers","engagement and ad spending"],"PINS":["visual discovery and shopping advertising","users and advertisers","shopping engagement and ad demand"],"RDDT":["online discussion communities and advertising","users, advertisers and data partners","engagement and monetization"],"TKO":["sports and live entertainment properties","fans, broadcasters and sponsors","media rights and live-event demand"],"COF":["consumer credit cards and banking","cardholders and depositors","credit losses and interest rates"],"AXP":["payments, credit cards and travel services","cardholders and merchants","consumer spending and credit quality"],"HOOD":["investment brokerage and financial services app","individual investors","trading activity and interest income"],"SOFI":["digital banking, lending and financial technology","banking and borrowing customers","loan performance and deposits"],"COIN":["cryptocurrency trading and related services","retail and institutional customers","crypto activity and regulation"],"XYZ":["merchant payments and consumer financial technology","merchants and Cash App users","payment volume and service adoption"],"GS":["investment banking, trading and asset management","companies and investors","deal activity and market conditions"],"MS":["wealth management, investment banking and trading","investors and corporate clients","asset levels and deal activity"],"SCHW":["brokerage, banking and wealth services","individual investors and advisers","client assets and interest rates"],"C":["global banking, cards and institutional services","consumers and businesses","credit quality and international activity"],"AFRM":["buy-now-pay-later and payment financing","shoppers and merchants","transaction volume and loan losses"],"LLY":["prescription medicines including diabetes and obesity treatments","patients and healthcare systems","drug demand, manufacturing and clinical results"],"CVS":["pharmacies, health insurance and healthcare services","patients, members and employers","medical costs and pharmacy economics"],"ABT":["diagnostics, medical devices and nutrition products","hospitals, patients and consumers","procedure demand and product launches"],"MRK":["prescription medicines and vaccines","patients and healthcare systems","drug demand and patent timelines"],"HCA":["hospital and healthcare facility operations","patients and insurers","patient volumes and staffing costs"],"TMO":["scientific instruments, diagnostics and laboratory services","research labs and drug developers","research funding and laboratory spending"],"ISRG":["robot-assisted surgical systems and instruments","hospitals and surgeons","procedure growth and system installations"],"MDT":["medical devices and surgical technologies","hospitals and patients","procedure volumes and product adoption"],"GILD":["prescription medicines including antiviral therapies","patients and healthcare systems","treatment demand and clinical pipeline"],"VRTX":["specialty medicines and drug development","patients and healthcare systems","new treatments and clinical progress"],"MCK":["pharmaceutical distribution and healthcare services","pharmacies and healthcare providers","distribution volume and margins"],"MRNA":["mRNA vaccines and therapeutic development","healthcare buyers and partners","vaccine demand and clinical pipeline"],"COP":["oil and natural-gas exploration and production","energy buyers","commodity prices and production costs"],"CAT":["construction and mining machinery and engines","contractors and industrial customers","equipment demand and dealer inventory"],"DE":["agricultural and construction machinery","farmers and contractors","farm income and equipment demand"],"GE":["commercial aircraft engines and aerospace services","airlines and aircraft makers","flight hours and engine deliveries"],"NEE":["regulated electric utilities and renewable-energy development","electric customers and energy buyers","power demand and project costs"],"DUK":["electric and gas utility operations","households and businesses","regulated rates and capital spending"],"SLB":["technology and services for oil and gas production","energy producers","drilling activity and energy investment"],"FSLR":["solar modules and related technology","solar developers and utilities","solar orders and manufacturing costs"],"CEG":["electricity generation including nuclear power","utilities and power buyers","power prices and generation output"],"VST":["electricity generation and retail energy","power customers","electricity prices and plant performance"],"ETN":["electrical equipment and power-management systems","industrial and data-center customers","electrification and infrastructure spending"],"HON":["industrial automation, aerospace and building technologies","industrial and aerospace buyers","orders and industrial investment"],"GEV":["power-generation equipment, grid systems and wind technology","utilities and power developers","grid investment and project execution"],"MPC":["petroleum refining and fuel marketing","fuel distributors and consumers","refining margins and fuel demand"],"VLO":["petroleum refining and renewable fuels","fuel buyers","refining margins and feedstock costs"],"PWR":["electric grid, utility and infrastructure contracting","utilities and energy developers","project backlog and labor availability"],"LULU":["athletic apparel and accessories","fitness and lifestyle shoppers","brand demand and inventory"],"RL":["apparel and lifestyle brands","fashion shoppers","brand pricing and wholesale demand"],"DECK":["footwear and apparel including HOKA and UGG","footwear shoppers","brand momentum and distribution"],"UAA":["athletic apparel and footwear","sports and fitness shoppers","brand demand and margins"],"LEVI":["denim and casual apparel","apparel shoppers","denim demand and direct sales"],"CROX":["casual footwear and related brands","footwear shoppers","product demand and retail inventory"],"COLM":["outdoor apparel and footwear","outdoor consumers","seasonality and wholesale orders"],"ONON":["performance running footwear and apparel","runners and lifestyle shoppers","distribution and product adoption"],"VFC":["apparel and footwear brands","fashion and outdoor shoppers","brand turnaround and inventory"],"PVH":["fashion brands including Calvin Klein and Tommy Hilfiger","apparel shoppers","brand sales and wholesale demand"],"BIRK":["Birkenstock footwear","footwear shoppers","production capacity and brand demand"],"TPR":["accessible luxury handbags and accessories","fashion shoppers","brand demand and consumer spending"],"ASO":["sporting goods and outdoor retail","sports and outdoor shoppers","store traffic and product margins"],"Z":["real-estate search and related services","home shoppers and real-estate professionals","housing transactions and advertising"],"DHI":["homebuilding and residential development","home buyers","mortgage rates and construction costs"],"LEN":["homebuilding and residential development","home buyers","housing demand and building margins"],"PHM":["homebuilding and residential development","home buyers","mortgage affordability and land costs"],"O":["commercial property ownership and leasing","business tenants","rent collection and financing costs"],"PLD":["logistics and warehouse real estate","distribution and logistics tenants","warehouse occupancy and rent"],"SHW":["paint, coatings and related products","contractors and consumers","construction demand and raw materials"],"BLDR":["building materials and components","homebuilders and contractors","housing starts and lumber prices"],"CBRE":["commercial real-estate services and investment management","property owners and occupiers","leasing and transaction activity"],"AMT":["communications towers and infrastructure","wireless carriers","tenant demand and infrastructure investment"],"SPG":["shopping-mall and retail property ownership","retail tenants","occupancy and tenant sales"],"WY":["timberlands and wood products","builders and industrial buyers","lumber prices and housing demand"],"LMT":["military aircraft, missiles and defense systems","government defense customers","contract awards and program execution"],"RTX":["aerospace engines, systems and defense technology","airlines, aircraft makers and governments","aircraft production and defense orders"],"NOC":["aerospace, space and defense systems","government customers","program funding and execution"],"GD":["defense systems, business jets and information technology","governments and aircraft buyers","contract backlog and deliveries"],"LHX":["communications, sensors and defense technology","government and aerospace buyers","program funding and orders"],"HII":["military shipbuilding and defense technology","government customers","shipbuilding schedules and labor capacity"],"BA":["commercial aircraft and defense systems","airlines and governments","aircraft deliveries and production quality"],"HWM":["engineered aerospace components","aircraft and engine manufacturers","aircraft build rates and materials"],"AVAV":["uncrewed aircraft and defense systems","government and commercial buyers","defense demand and production"],"AXON":["public-safety devices, cameras and software","police and public-safety agencies","agency budgets and subscriptions"]};
  const recognizableExamples={"AAPL":"iPhone, MacBook, iPad, AirPods, App Store","MSFT":"Windows, Microsoft 365, Azure, Xbox, LinkedIn","NVDA":"GeForce graphics cards, AI data-center GPUs","AMD":"Ryzen processors, Radeon graphics, EPYC server chips","DELL":"Dell laptops, desktops, PowerEdge servers","INTC":"Core processors, Xeon server chips, Intel Foundry","ADBE":"Photoshop, Illustrator, Acrobat, Creative Cloud","CRM":"Salesforce CRM, Slack, Tableau","GOOGL":"Google Search, YouTube, Android, Google Cloud","META":"Instagram, Facebook, WhatsApp, Meta Quest","AVGO":"Broadcom networking chips, VMware software","ORCL":"Oracle Database, Oracle Cloud, NetSuite","MU":"Micron DRAM, Crucial memory and storage","PLTR":"Foundry, Gotham, AIP","CSCO":"Cisco networking equipment, Webex","QCOM":"Snapdragon chips, wireless technology licenses","IBM":"IBM consulting, mainframe systems, Red Hat","NOW":"ServiceNow workflow platform","SNOW":"Snowflake cloud data platform","TSM":"chips manufactured for other semiconductor designers","CRWD":"Falcon cybersecurity platform","PANW":"Next-Generation Firewalls, Prisma Cloud, Cortex","AMZN":"Amazon marketplace, Prime, AWS, advertising","WMT":"Walmart, Sam's Club","TGT":"Target stores and private-label products","COST":"Costco warehouses, Kirkland Signature","HD":"Home Depot stores, Pro services","LOW":"Lowe's home-improvement stores","EBAY":"eBay marketplace","ETSY":"Etsy handmade and vintage marketplace","BABA":"Taobao, Tmall, Alibaba Cloud","TSLA":"Model 3, Model Y, Powerwall, Megapack","F":"Ford F-Series, Bronco, Transit, Lincoln","GM":"Chevrolet Silverado, GMC, Cadillac","TM":"Toyota Corolla, Camry, RAV4, Lexus","UBER":"Uber rides, Uber Eats, Uber Freight","LYFT":"Lyft rides","RIVN":"R1T pickup, R1S SUV, commercial vans","RACE":"Ferrari sports cars","KO":"Coca-Cola, Sprite, Fanta, Minute Maid","PEP":"Pepsi, Gatorade, Lay's, Doritos, Quaker","MCD":"McDonald's restaurants, franchise royalties","SBUX":"Starbucks cafés, packaged coffee","CMG":"Chipotle restaurants","DPZ":"Domino's pizza stores and franchise network","YUM":"Taco Bell, KFC, Pizza Hut","MNST":"Monster Energy, Reign","CAVA":"CAVA restaurants, dips and spreads","DASH":"DoorDash marketplace and delivery","HSY":"Hershey's, Reese's, Kit Kat in the US","DIS":"Disney, Pixar, Marvel, ESPN, Disney parks","NFLX":"Netflix subscriptions and entertainment","SPOT":"Spotify music, podcasts, advertising","JPM":"Chase banking, JPMorgan investment services","BAC":"Bank of America, Merrill","V":"Visa payment network","MA":"Mastercard payment network","PYPL":"PayPal, Venmo, Braintree","PFE":"Pfizer medicines and vaccines","JNJ":"Johnson & Johnson medicines, MedTech","UNH":"UnitedHealthcare, Optum","XOM":"Exxon, Mobil, Esso","CVX":"Chevron, Texaco","NKE":"Nike, Jordan, Converse","SMCI":"Supermicro servers and AI racks","SNDK":"SanDisk flash storage","WDC":"Western Digital hard drives","STX":"Seagate hard drives","MRVL":"Marvell data-center and networking chips","LRCX":"Lam Research chip-fabrication equipment","AMAT":"Applied Materials chipmaking equipment","APP":"AppLovin advertising technology","VRT":"Vertiv data-center power and cooling","ANET":"Arista data-center switches","BBY":"Best Buy stores, Geek Squad","CHWY":"Chewy pet supplies, Autoship","MELI":"Mercado Libre, Mercado Pago","ROST":"Ross Dress for Less, dd's DISCOUNTS","TJX":"TJ Maxx, Marshalls, HomeGoods","DAL":"Delta Air Lines","LUV":"Southwest Airlines","AAL":"American Airlines","UPS":"UPS parcel delivery","LCID":"Lucid Air, Lucid Gravity","NIO":"NIO electric vehicles","FDX":"FedEx shipping","CVNA":"Carvana used-car marketplace","SHAK":"Shake Shack","KDP":"Dr Pepper, Keurig, Canada Dry","MDLZ":"Oreo, Ritz, Cadbury, Toblerone","CELH":"Celsius energy drinks","BROS":"Dutch Bros drive-through drinks","TSN":"Tyson chicken, Jimmy Dean, Hillshire Farm","GIS":"Cheerios, Nature Valley, Häagen-Dazs","KHC":"Heinz ketchup, Kraft Mac & Cheese, Philadelphia","CPB":"Campbell's soup, Goldfish, Pepperidge Farm","CAG":"Healthy Choice, Slim Jim, Birds Eye","WING":"Wingstop","TXRH":"Texas Roadhouse, Bubba's 33","QSR":"Burger King, Tim Hortons, Popeyes","SONY":"PlayStation, Sony Pictures, Sony Music","TTWO":"Grand Theft Auto, NBA 2K, Red Dead Redemption","CMCSA":"Xfinity, NBC, Universal","WBD":"HBO, Warner Bros., Discovery","RBLX":"Roblox platform and virtual currency","PARA":"Paramount, CBS, Nickelodeon","ROKU":"Roku devices, Roku Channel, advertising","SNAP":"Snapchat, Snapchat ads","PINS":"Pinterest advertising","RDDT":"Reddit communities and advertising","TKO":"UFC, WWE","COF":"Capital One credit cards and banking","AXP":"American Express cards, travel","HOOD":"Robinhood brokerage app","SOFI":"SoFi banking, loans and investing","COIN":"Coinbase exchange and custody","XYZ":"Square, Cash App, Afterpay","GS":"Goldman Sachs investment banking","MS":"Morgan Stanley, E*TRADE","SCHW":"Charles Schwab brokerage","C":"Citibank, Citi institutional banking","AFRM":"Affirm installment payments","LLY":"Mounjaro, Zepbound and other medicines","CVS":"CVS Pharmacy, Aetna, Caremark","ABT":"FreeStyle Libre, diagnostics, nutrition","MRK":"Keytruda and vaccines","HCA":"HCA hospitals","TMO":"Thermo Fisher laboratory instruments","ISRG":"da Vinci surgical systems","MDT":"Medtronic medical devices","GILD":"HIV medicines and other therapies","VRTX":"cystic fibrosis medicines","MCK":"McKesson pharmaceutical distribution","MRNA":"Moderna vaccines and mRNA research","COP":"ConocoPhillips oil and gas production","CAT":"Caterpillar excavators, bulldozers","DE":"John Deere tractors, combines","GE":"GE Aerospace jet engines","NEE":"Florida Power & Light, energy generation","DUK":"Duke Energy electric utilities","SLB":"SLB oilfield technology and services","FSLR":"First Solar solar modules","CEG":"Constellation nuclear power plants","VST":"Vistra power generation and retail electricity","ETN":"Eaton power-management equipment","HON":"Honeywell automation and aerospace systems","GEV":"GE Vernova gas turbines, grid equipment, wind turbines","MPC":"Marathon Petroleum refineries, Speedway legacy","VLO":"Valero fuel refineries","PWR":"Quanta electric-grid construction","LULU":"lululemon apparel","RL":"Polo Ralph Lauren","DECK":"HOKA, UGG","UAA":"Under Armour","LEVI":"Levi's jeans, Dockers","CROX":"Crocs, HEYDUDE","COLM":"Columbia, SOREL","ONON":"On running shoes","VFC":"The North Face, Vans, Timberland","PVH":"Calvin Klein, Tommy Hilfiger","BIRK":"Birkenstock sandals","TPR":"Coach, Kate Spade","ASO":"Academy Sports + Outdoors","Z":"Zillow listings, Premier Agent","DHI":"D.R. Horton homes","LEN":"Lennar homes","PHM":"Pulte Homes, Del Webb","O":"Realty Income retail-property leases","PLD":"Prologis warehouses","SHW":"Sherwin-Williams paint","BLDR":"Builders FirstSource building supplies","CBRE":"CBRE commercial property services","AMT":"American Tower cell towers","SPG":"Simon Property Group shopping centers","WY":"Weyerhaeuser timberlands","LMT":"F-35, missiles, defense systems","RTX":"Pratt & Whitney engines, Collins Aerospace, Raytheon","NOC":"B-21 bomber, space and defense systems","GD":"Gulfstream jets, submarines","LHX":"L3Harris communications and sensors","HII":"US Navy aircraft carriers and submarines","BA":"Boeing 737, 787, defense aircraft","HWM":"Howmet aircraft engine and structural parts","AVAV":"AeroVironment drones","AXON":"TASER devices, Axon body cameras"};
  // Company-specific educational descriptions for the 13-stock defense research industry.
  const defenseProfiles={
  "LMT": {
    "overview": "Builds military aircraft, missiles, helicopters, sensors and spacecraft for U.S. and allied governments.",
    "products": "F-35 fighter, C-130J transport, Sikorsky Black Hawk, PAC-3 missile defense and Orion spacecraft.",
    "businessModel": "Government development, production and long-term maintenance contracts fund most work.",
    "insight": "An aircraft generates service, upgrade and spare-parts work long after delivery.",
    "watch": "Order backlog, program costs, production and government funding.",
    "source": "https://www.lockheedmartin.com/en-us/news/annual-reports.html"
  },
  "RTX": {
    "overview": "Combines Pratt & Whitney aircraft engines, Collins Aerospace aviation systems and Raytheon defense technology.",
    "products": "GTF jet engines, Collins avionics, Patriot missile defense and radar.",
    "businessModel": "Sells engines, aerospace systems, defense equipment and replacement parts and services.",
    "insight": "Airlines may pay to maintain an engine through years of flying, not just buy it once.",
    "watch": "Aircraft build rates, engine maintenance costs, defense orders and supply chains.",
    "source": "https://www.rtx.com/investors"
  },
  "NOC": {
    "overview": "Develops military aircraft, space technology, sensors and other long-duration defense systems.",
    "products": "B-21 Raider bomber, E-2D Hawkeye, space payloads and solid rocket motors.",
    "businessModel": "Government-funded research, engineering, production and support contracts.",
    "insight": "Some programs spend years in development before production deliveries begin.",
    "watch": "Program funding, testing milestones, contract costs and suppliers.",
    "source": "https://investor.northropgrumman.com/"
  },
  "GD": {
    "overview": "Makes Gulfstream business jets as well as submarines, combat vehicles and government IT systems.",
    "products": "Gulfstream jets, Virginia-class submarines, Abrams tanks and Stryker vehicles.",
    "businessModel": "Aircraft sales, government shipbuilding and vehicle contracts, technology services and support.",
    "insight": "Business-jet buyers and Navy shipbuilding customers create very different demand cycles.",
    "watch": "Jet deliveries, shipyard labor, submarine schedules and backlog.",
    "source": "https://investorrelations.gd.com/"
  },
  "LHX": {
    "overview": "Provides military communications, electronic systems, sensors, space technology and rocket propulsion.",
    "products": "Tactical radios, surveillance sensors, electronic warfare and Aerojet Rocketdyne propulsion.",
    "businessModel": "Government and prime-contractor systems contracts, upgrades and support.",
    "insight": "A small radio or sensor can be essential even though its brand is not seen by consumers.",
    "watch": "Program awards, missile demand, contract execution and backlog.",
    "source": "https://www.l3harris.com/investors"
  },
  "HII": {
    "overview": "Builds and services U.S. Navy ships and supplies defense engineering and mission technology.",
    "products": "Aircraft carriers, nuclear submarines, amphibious ships and destroyers.",
    "businessModel": "Long-term government shipbuilding, repair and technology contracts.",
    "insight": "Shipyards need specialized workers and facilities; they cannot instantly expand output.",
    "watch": "Ship schedules, skilled labor, supplier capacity and contract costs.",
    "source": "https://ir.hii.com/"
  },
  "BA": {
    "overview": "Manufactures commercial airliners alongside military aircraft and space systems and provides aftermarket services.",
    "products": "737 and 787 jets, 777 freighters, KC-46 tankers, parts and aircraft support.",
    "businessModel": "Commercial aircraft deliveries, government contracts, spare parts and services.",
    "insight": "An airline order is not the same as a delivered plane or recognized revenue.",
    "watch": "Production quality, certification, deliveries, cash flow and contract performance.",
    "source": "https://investors.boeing.com/"
  },
  "HWM": {
    "overview": "Makes engineered metal components used in jet engines, aircraft structures and gas turbines.",
    "products": "Turbine blades, engine components, aerospace fasteners and precision forgings.",
    "businessModel": "Sells specialized components to aircraft and engine manufacturers and replacement parts to service markets.",
    "insight": "Travelers may fly on aircraft containing Howmet parts without ever seeing its name.",
    "watch": "Aircraft build rates, engine repair demand, materials and manufacturing capacity.",
    "source": "https://www.howmet.com/annualreport/"
  },
  "AVAV": {
    "overview": "Develops uncrewed aircraft, autonomous systems and related defense technology.",
    "products": "Switchblade systems, Puma reconnaissance aircraft and other uncrewed platforms.",
    "businessModel": "Sales of equipment, engineering, training and support to defense customers.",
    "insight": "Some uncrewed systems are reusable and others are designed for single-use missions.",
    "watch": "Government orders, production scaling and contract integration.",
    "source": "https://investor.avinc.com/financial-information/annual-reports"
  },
  "AXON": {
    "overview": "Provides public-safety hardware and software to police and other agencies.",
    "products": "TASER devices, Axon body cameras, Evidence.com and Fleet video.",
    "businessModel": "Device sales plus recurring cloud software, evidence storage and service subscriptions.",
    "insight": "A camera sale creates an ongoing need for secure video storage and evidence management.",
    "watch": "Subscription renewals, agency budgets, product adoption and privacy requirements.",
    "source": "https://investor.axon.com/"
  },
  "PLTR": {
    "overview": "Creates data-analysis and AI software for government and commercial organizations.",
    "products": "Gotham, Foundry, Artificial Intelligence Platform and Apollo.",
    "businessModel": "Software subscriptions, platform contracts, implementation and support.",
    "insight": "It sells software, not primarily physical defense equipment; government is only one customer group.",
    "watch": "Government versus commercial revenue, renewals and customer concentration.",
    "source": "https://investors.palantir.com/"
  },
  "GE": {
    "overview": "Builds and supports engines and propulsion components for commercial and military aircraft.",
    "products": "GE90, GE9X, CFM LEAP through a joint venture, military engines and spare parts.",
    "businessModel": "Engine sales, long-term maintenance, repairs and replacement parts.",
    "insight": "More flight hours can create aftermarket work for an installed engine fleet.",
    "watch": "Engine deliveries, aircraft utilization, service margins and manufacturing capacity.",
    "source": "https://www.geaerospace.com/investor-relations/annual-report"
  },
  "HON": {
    "overview": "A diversified industrial company with aerospace systems alongside automation and other operations.",
    "products": "Auxiliary power units, avionics, navigation systems, Honeywell Forge and industrial automation.",
    "businessModel": "Equipment, components, software, spare parts and maintenance services.",
    "insight": "This aerospace-category ticker includes non-aerospace businesses, so students should inspect segment reporting.",
    "watch": "Segment mix, portfolio changes, aircraft demand and service orders.",
    "source": "https://investor.honeywell.com/"
  }
};
  // Retail and shopping company-specific student research.
  const retailProfiles={
  "AMZN": {
    "overview": "Amazon operates an online marketplace, sells goods directly and runs cloud computing, advertising and subscription businesses.",
    "products": "Amazon.com, Prime, Amazon Web Services (AWS), Kindle, Ring and Whole Foods.",
    "businessModel": "Product sales, third-party seller fees, AWS cloud services, advertising and Prime subscriptions.",
    "insight": "A shopper sees a retailer, but AWS sells computing power to businesses and advertising sells visibility to merchants.",
    "watch": "Compare AWS growth with retail margins, fulfillment costs and advertising revenue.",
    "source": "https://ir.aboutamazon.com/"
  },
  "WMT": {
    "overview": "Walmart operates large stores, grocery and online shopping businesses, and membership warehouse stores.",
    "products": "Walmart Supercenters, Walmart.com, Sam's Club and Walmart+.",
    "businessModel": "Retail merchandise and groceries, Sam's Club membership fees, advertising and marketplace services.",
    "insight": "Groceries draw frequent visits; Walmart's huge purchasing volume can help it negotiate supplier prices.",
    "watch": "Comparable-store sales, grocery mix, labor, inventory and e-commerce profitability.",
    "source": "https://stock.walmart.com/"
  },
  "TGT": {
    "overview": "Target sells groceries, clothing, home goods, beauty products and everyday merchandise through stores and digital channels.",
    "products": "Target stores, Good & Gather, Cat & Jack, up&up, Drive Up and Target Circle.",
    "businessModel": "Merchandise sales, owned-brand products, marketplace activity and loyalty-related services.",
    "insight": "Target designs many of its own store brands, so a product can be exclusive rather than identical to a rival's.",
    "watch": "Customer traffic, discretionary purchases, shrink, inventory and profit margins.",
    "source": "https://corporate.target.com/investors"
  },
  "COST": {
    "overview": "Costco operates membership-only warehouse clubs selling bulk groceries, household goods and other merchandise.",
    "products": "Costco warehouses, Kirkland Signature, Costco Gas and Costco.com.",
    "businessModel": "Membership fees and merchandise sales at relatively low product markups.",
    "insight": "Membership renewals are an important measure because annual fees support a business built around value pricing.",
    "watch": "Membership renewal rates, comparable sales, warehouse expansion and merchandise margins.",
    "source": "https://investor.costco.com/"
  },
  "HD": {
    "overview": "Home Depot sells building materials, tools, appliances and home-improvement products to households and professionals.",
    "products": "Home Depot stores, Pro services, tool rental and online ordering.",
    "businessModel": "Product sales, installation-related services and professional-customer business.",
    "insight": "A contractor buying supplies for many jobs behaves differently from a homeowner buying paint once.",
    "watch": "Home sales, renovation demand, professional sales, inventory and lumber prices.",
    "source": "https://ir.homedepot.com/"
  },
  "LOW": {
    "overview": "Lowe's is a home-improvement retailer serving homeowners, do-it-yourself shoppers and professional contractors.",
    "products": "Lowe's stores, MyLowe's, Pro services and home-improvement merchandise.",
    "businessModel": "Merchandise sales and related services across stores and digital channels.",
    "insight": "Homeowners may postpone a kitchen remodel when borrowing costs rise, while essential repairs still need supplies.",
    "watch": "DIY versus professional demand, housing activity, product margins and store productivity.",
    "source": "https://corporate.lowes.com/investors"
  },
  "BBY": {
    "overview": "Best Buy sells consumer electronics and appliances and provides technology installation, repair and support.",
    "products": "Best Buy stores, Geek Squad, Best Buy online and appliance installation.",
    "businessModel": "Electronics and appliance sales plus service, installation and membership offerings.",
    "insight": "A laptop sale can lead to additional revenue from setup, protection or repairs, but shoppers can delay upgrades.",
    "watch": "Device replacement cycles, comparable sales, services and competition from online sellers.",
    "source": "https://investors.bestbuy.com/"
  },
  "EBAY": {
    "overview": "eBay connects independent buyers and sellers through an online marketplace rather than primarily owning the merchandise listed.",
    "products": "eBay marketplace, eBay Motors and authenticated collectibles and fashion categories.",
    "businessModel": "Transaction fees, promoted listings and other seller services.",
    "insight": "A marketplace can earn a fee when someone else sells an item, without buying and stocking that item itself.",
    "watch": "Gross merchandise volume, active buyers, seller fees and competition.",
    "source": "https://investors.ebayinc.com/"
  },
  "ETSY": {
    "overview": "Etsy runs a marketplace centered on handmade, vintage and distinctive goods sold by independent merchants.",
    "products": "Etsy marketplace, personalized gifts, handmade products and vintage listings.",
    "businessModel": "Seller transaction and listing fees, advertising and merchant services.",
    "insight": "A custom gift can compete on uniqueness rather than price alone; Etsy depends on keeping buyers and sellers engaged.",
    "watch": "Active buyers, repeat purchases, seller activity and marketplace fees.",
    "source": "https://investors.etsy.com/"
  },
  "CHWY": {
    "overview": "Chewy is an online pet-products retailer offering food, supplies, pharmacy and pet-health services.",
    "products": "Chewy.com, Autoship recurring deliveries, Chewy Pharmacy and pet supplies.",
    "businessModel": "Direct sales of pet products and related pet-health goods and services.",
    "insight": "Autoship turns recurring pet-food needs into repeat orders, which can make demand more predictable.",
    "watch": "Autoship sales, customer retention, fulfillment costs and pet-health expansion.",
    "source": "https://investor.chewy.com/"
  },
  "BABA": {
    "overview": "Alibaba operates Chinese and international commerce platforms and a cloud-computing business.",
    "products": "Taobao, Tmall, Alibaba.com, AliExpress and Alibaba Cloud.",
    "businessModel": "Merchant advertising and services, commerce activity, cloud computing and other digital services.",
    "insight": "Alibaba.com helps businesses source products wholesale, while Taobao and Tmall serve different consumer-shopping needs.",
    "watch": "China consumer demand, merchant activity, cloud growth and regulatory developments.",
    "source": "https://www.alibabagroup.com/en-US/ir/home"
  },
  "MELI": {
    "overview": "MercadoLibre operates a Latin American online marketplace with payments, credit and logistics businesses.",
    "products": "Mercado Libre marketplace, Mercado Pago and Mercado Envios.",
    "businessModel": "Marketplace fees, advertising, payment processing, financial services and logistics.",
    "insight": "A seller may use the same ecosystem to list a product, collect payment and ship the order.",
    "watch": "Regional consumer demand, payment volumes, credit losses and delivery costs.",
    "source": "https://investor.mercadolibre.com/"
  },
  "ROST": {
    "overview": "Ross Stores runs off-price stores selling branded apparel, footwear and home products at discounted prices.",
    "products": "Ross Dress for Less and dd's DISCOUNTS.",
    "businessModel": "Merchandise purchased from suppliers and resold through its stores.",
    "insight": "Off-price buyers can purchase excess or seasonal inventory and offer shoppers changing assortments.",
    "watch": "Store traffic, merchandise buying opportunities, freight and operating costs.",
    "source": "https://investors.rossstores.com/"
  },
  "TJX": {
    "overview": "TJX operates off-price retail chains selling apparel and home merchandise across several countries.",
    "products": "TJ Maxx, Marshalls, HomeGoods, Sierra and TK Maxx.",
    "businessModel": "Retail sales of branded and other merchandise sourced through an off-price buying model.",
    "insight": "Its treasure-hunt assortment encourages browsing because the same item may not be available on the next visit.",
    "watch": "Comparable sales, buying opportunities, inventory turnover and international performance.",
    "source": "https://investor.tjx.com/"
  }
};
  // Comprehensive housing and real estate educational profiles.
  const housingProfiles={
  "Z": {
    "overview": "Zillow Group runs a digital real-estate marketplace that helps people search for homes, connect with agents, arrange tours and access related services. It is not primarily a homebuilder or a landlord.",
    "products": "Zillow, Trulia, StreetEasy, Zillow Rentals and Premier Agent.",
    "customers": "Home shoppers, renters, real-estate agents, property managers and mortgage customers.",
    "businessModel": "Advertising and marketing services for agents and rental properties, plus mortgage and related transaction services.",
    "insight": "A home search is often free for consumers because professionals pay to reach prospective customers; traffic is valuable only if it produces useful leads and transactions.",
    "watch": "Housing transaction volume, mortgage rates, agent spending, lead quality and competition from other listing portals.",
    "question": "Why can Zillow's revenue change even when its website traffic stays high?",
    "source": "https://investors.zillowgroup.com/"
  },
  "DHI": {
    "overview": "D.R. Horton is a major U.S. homebuilder that acquires or develops land, builds houses and sells completed homes. Its operations also include related financial and rental businesses.",
    "products": "D.R. Horton, Express Homes, Emerald Homes and Freedom Homes.",
    "customers": "First-time, move-up and other homebuyers.",
    "businessModel": "New-home sales, related mortgage and title services, and other housing operations.",
    "insight": "A builder can offer mortgage-rate incentives or adjust home prices to attract buyers, but those incentives may reduce profit per home.",
    "watch": "Mortgage affordability, orders, cancellations, community count, land costs and gross margin.",
    "question": "How does a higher mortgage rate affect the number of buyers who can afford a new house?",
    "source": "https://investor.drhorton.com/"
  },
  "LEN": {
    "overview": "Lennar builds and sells new homes across U.S. markets and provides homebuyer financing and related services.",
    "products": "Lennar homes, Everything's Included approach and Lennar Mortgage.",
    "customers": "Homebuyers in the communities where it develops and builds.",
    "businessModel": "Home closings, mortgage origination and other related housing services.",
    "insight": "The sale of a completed home differs from signing a contract: construction and closing determine when the builder receives much of its revenue.",
    "watch": "New orders, deliveries, backlog, incentives, land supply and construction costs.",
    "question": "Why might a builder report strong orders but fewer completed home deliveries?",
    "source": "https://investors.lennar.com/"
  },
  "PHM": {
    "overview": "PulteGroup builds homes for several life stages, from first-time purchasers to move-up buyers and active adults.",
    "products": "Pulte Homes, Centex, Del Webb and DiVosta.",
    "customers": "First-time buyers, growing households and active-adult buyers.",
    "businessModel": "New-home sales and related mortgage, title and insurance services.",
    "insight": "Different brands target different customers: an active-adult community may respond to different needs than a starter-home neighborhood.",
    "watch": "Buyer affordability, community openings, cancellation rates, land investment and construction margins.",
    "question": "How would marketing a Del Webb community differ from marketing a first-time buyer home?",
    "source": "https://www.pultegroupinc.com/investor-relations/default.aspx"
  },
  "O": {
    "overview": "Realty Income is a real-estate investment trust (REIT) that owns properties and leases them to businesses, often under long-term net leases.",
    "products": "Retail, industrial and other commercial properties leased to operating businesses.",
    "customers": "Business tenants such as retailers, service providers and industrial operators.",
    "businessModel": "Rental payments from tenants and returns on its property portfolio.",
    "insight": "In a triple-net lease, tenants generally pay property taxes, insurance and maintenance, which changes the landlord's expense exposure.",
    "watch": "Tenant financial health, occupancy, lease duration, debt costs, acquisitions and dividend coverage.",
    "question": "Why does a landlord care about a tenant's ability to keep paying rent even when the lease is long?",
    "source": "https://www.realtyincome.com/investors"
  },
  "PLD": {
    "overview": "Prologis is a REIT specializing in logistics real estate such as warehouses and distribution centers near major markets.",
    "products": "Distribution centers, logistics parks and supply-chain real estate.",
    "customers": "E-commerce businesses, retailers, manufacturers and logistics providers.",
    "businessModel": "Warehouse rent, property-related services and development/investment activities.",
    "insight": "A warehouse near customers, highways and ports can reduce delivery time; location is part of the product.",
    "watch": "Warehouse occupancy, rental growth, new supply, e-commerce demand and financing costs.",
    "question": "Why might a warehouse near a major city command more rent than one far from customers?",
    "source": "https://ir.prologis.com/"
  },
  "SHW": {
    "overview": "Sherwin-Williams manufactures and sells paints, coatings and related products to contractors, homeowners and industrial customers.",
    "products": "Sherwin-Williams paints, stores, Valspar, Minwax and industrial coatings.",
    "customers": "Painting contractors, DIY customers, builders, manufacturers and retailers.",
    "businessModel": "Paint and coating sales through its own stores, retail partners and industrial channels.",
    "insight": "A professional painter may value consistent color matching, availability and jobsite service as much as the price of a gallon.",
    "watch": "Renovation and construction activity, raw-material prices, contractor demand and operating margins.",
    "question": "How can a paint company earn revenue from both home remodeling and industrial manufacturing?",
    "source": "https://investors.sherwin-williams.com/"
  },
  "BLDR": {
    "overview": "Builders FirstSource supplies building materials and manufactured components to professional builders and contractors.",
    "products": "Lumber, trusses, wall panels, windows, doors and other building products.",
    "customers": "Homebuilders, remodelers and construction contractors.",
    "businessModel": "Sales of construction materials, prefabricated components and value-added building services.",
    "insight": "Factory-made trusses and wall panels can reduce work at the construction site, so the company sells both materials and labor-saving solutions.",
    "watch": "Housing starts, lumber prices, builder demand, product mix and manufacturing capacity.",
    "question": "Why might a builder buy a prefabricated wall panel rather than assemble every piece on site?",
    "source": "https://investors.bldr.com/"
  },
  "LOW": {
    "overview": "Lowe's sells home-improvement products and services to homeowners and professional contractors through stores and digital channels.",
    "products": "Lowe's stores, Pro services, appliances, tools and building supplies.",
    "customers": "DIY shoppers, homeowners, property managers and contractors.",
    "businessModel": "Retail product sales and related services.",
    "insight": "Unlike a homebuilder, Lowe's can benefit from repair and renovation spending even when fewer new houses are built.",
    "watch": "Comparable sales, professional-customer demand, renovation spending, inventory and margins.",
    "question": "How could an aging home create business for Lowe's even without a home sale?",
    "source": "https://corporate.lowes.com/investors"
  },
  "HD": {
    "overview": "Home Depot sells home-improvement materials and tools and serves professional tradespeople as well as individual households.",
    "products": "Home Depot stores, Pro services, building materials, tools and installation services.",
    "customers": "Homeowners, remodelers, builders and trade professionals.",
    "businessModel": "Merchandise sales and associated services.",
    "insight": "Professional contractors often purchase repeatedly for many projects, making their needs different from a one-time DIY shopper.",
    "watch": "Large-project demand, Pro sales, housing turnover, renovation activity and inventory.",
    "question": "Why could slower home sales affect purchases of flooring, cabinets and appliances?",
    "source": "https://ir.homedepot.com/"
  },
  "CBRE": {
    "overview": "CBRE Group provides commercial real-estate services rather than mainly selling homes to consumers.",
    "products": "Commercial property brokerage, leasing, property management, valuation and investment management.",
    "customers": "Corporate occupiers, landlords, property investors and institutions.",
    "businessModel": "Leasing and transaction fees, recurring property/facilities management fees and investment-related services.",
    "insight": "Some revenue depends on big property deals, while managing buildings can generate more recurring service income.",
    "watch": "Commercial leasing, property sales, interest rates, outsourcing contracts and assets under management.",
    "question": "How is earning a brokerage fee different from collecting monthly rent as a building owner?",
    "source": "https://ir.cbre.com/"
  },
  "AMT": {
    "overview": "American Tower is a REIT that owns communications infrastructure, especially wireless towers, and leases space to network operators.",
    "products": "Cell towers, rooftop communications sites and related infrastructure.",
    "customers": "Wireless carriers and other communications-network operators.",
    "businessModel": "Long-term lease payments for space and equipment on communications sites.",
    "insight": "Several carriers can use different positions on the same tower, allowing one physical asset to support multiple tenants.",
    "watch": "Carrier network investment, lease renewals, tenant concentration, debt and capital spending.",
    "question": "Why might adding another carrier to an existing tower improve the economics of that tower?",
    "source": "https://www.americantower.com/investor-relations/"
  },
  "SPG": {
    "overview": "Simon Property Group is a REIT that owns and operates shopping, dining and entertainment properties, including malls and outlet centers.",
    "products": "Simon malls, Premium Outlets and The Mills properties.",
    "customers": "Retailers, restaurants and other commercial tenants, with shoppers as the end visitors.",
    "businessModel": "Base rent, percentage rent in some leases, property services and other real-estate activities.",
    "insight": "Foot traffic matters because successful stores are better able to pay rent; some leases also link part of rent to tenant sales.",
    "watch": "Occupancy, tenant sales, lease renewals, redevelopment costs and consumer spending.",
    "question": "Why does a mall landlord care about how much money its tenants' stores make?",
    "source": "https://investors.simon.com/"
  },
  "WY": {
    "overview": "Weyerhaeuser owns and manages timberlands and produces wood products used in construction and other industries.",
    "products": "Timberlands, lumber, oriented strand board and engineered wood products.",
    "customers": "Homebuilders, building-material distributors and industrial wood buyers.",
    "businessModel": "Timber sales, wood-product sales and related land activities.",
    "insight": "Trees take years to grow; timberland is both a productive asset and a resource that must be managed over long periods.",
    "watch": "Lumber prices, housing construction, mill costs, timber harvest volumes and land management.",
    "question": "Why might a decline in lumber prices hurt a timber and wood-products company even if it owns valuable land?",
    "source": "https://investor.weyerhaeuser.com/"
  }
};
  const brandProfiles={
  "NKE": {
    "overview": "Nike designs and markets athletic footwear, apparel and equipment worldwide, selling through its own channels and wholesale partners.",
    "products": "Nike, Jordan, Converse, Air Max, Air Jordan and Nike Running.",
    "customers": "Athletes, everyday consumers, sports teams and retail partners.",
    "businessModel": "Footwear, clothing and equipment sales through Nike stores, websites and wholesale retailers.",
    "insight": "Nike pays for product design, athlete partnerships and marketing while relying heavily on contracted manufacturers; brand demand and inventory discipline matter.",
    "watch": "Consumer demand, direct versus wholesale sales, product launches, competition and inventory.",
    "question": "Why can an athlete endorsement help sell shoes even to customers who do not play that sport?",
    "source": "https://investors.nike.com/"
  },
  "LULU": {
    "overview": "Lululemon designs premium athletic and lifestyle clothing, with a strong focus on yoga, training and everyday wear.",
    "products": "Align leggings, ABC pants, athletic tops and lululemon stores.",
    "customers": "Fitness and lifestyle shoppers, including women and men.",
    "businessModel": "Apparel and accessory sales through stores and e-commerce.",
    "insight": "Its positioning combines fabric design, product fit and community-led marketing; premium prices require customers to perceive added value.",
    "watch": "Comparable sales, international expansion, new product categories and discounting.",
    "question": "How could frequent discounts change the way customers perceive a premium brand?",
    "source": "https://corporate.lululemon.com/investors"
  },
  "RL": {
    "overview": "Ralph Lauren is a lifestyle fashion company that designs and markets clothing, accessories, fragrances and home products.",
    "products": "Polo Ralph Lauren, Ralph Lauren Collection, Purple Label and Ralph Lauren Home.",
    "customers": "Fashion consumers, department stores and licensed-product partners.",
    "businessModel": "Retail and wholesale sales plus licensing income.",
    "insight": "A recognizable logo and consistent design language can extend from shirts to fragrances and home goods through different business arrangements.",
    "watch": "Brand pricing, wholesale relationships, international demand and licensing.",
    "question": "Why might a fashion company license its name for a product rather than manufacture it itself?",
    "source": "https://investor.ralphlauren.com/"
  },
  "DECK": {
    "overview": "Deckers Brands owns footwear brands serving lifestyle and performance customers.",
    "products": "UGG and HOKA.",
    "customers": "Casual-footwear shoppers, runners, outdoor athletes and retail partners.",
    "businessModel": "Footwear and apparel sales through direct channels and wholesale partners.",
    "insight": "UGG and HOKA serve different occasions and customers, giving one parent company exposure to both lifestyle and performance footwear.",
    "watch": "HOKA growth, UGG seasonality, product availability and direct-to-consumer margins.",
    "question": "How does owning two different footwear brands change a company's dependence on one fashion trend?",
    "source": "https://ir.deckers.com/"
  },
  "UAA": {
    "overview": "Under Armour designs performance sportswear, footwear and accessories for training and competition.",
    "products": "Under Armour, HeatGear, ColdGear and Curry Brand.",
    "customers": "Athletes, teams, fitness customers and retail partners.",
    "businessModel": "Sales of performance apparel, footwear and accessories through wholesale and direct channels.",
    "insight": "Performance claims and technical fabrics are central to its pitch; product innovation must translate into repeat purchases.",
    "watch": "Brand demand, footwear sales, promotional activity, margins and restructuring efforts.",
    "question": "Why does a performance clothing brand need to explain what its fabric actually does?",
    "source": "https://about.underarmour.com/en/investors.html"
  },
  "LEVI": {
    "overview": "Levi Strauss & Co. designs and sells denim clothing and casual apparel through its brands and channels.",
    "products": "Levi's jeans, 501 jeans, denim jackets and Dockers where applicable to reporting period.",
    "customers": "Denim buyers, casualwear shoppers and wholesale retailers.",
    "businessModel": "Apparel sales through company-operated stores, e-commerce and wholesale accounts.",
    "insight": "The 501 is a recognizable product with a long history, but the company still needs new fits and styles to attract changing customers.",
    "watch": "Denim demand, direct-to-consumer growth, wholesale trends and inventory.",
    "question": "How can a company keep a classic product recognizable while responding to new fashion trends?",
    "source": "https://investors.levistrauss.com/"
  },
  "CROX": {
    "overview": "Crocs Inc. owns casual-footwear brands known for distinctive designs and comfort.",
    "products": "Crocs Classic Clog, Jibbitz charms and HEYDUDE.",
    "customers": "Casual-footwear shoppers, families and wholesale retailers.",
    "businessModel": "Footwear and accessory sales through direct and wholesale channels.",
    "insight": "Jibbitz turns a basic clog into a customizable product; brand collaborations can create attention but demand can change with fashion.",
    "watch": "Crocs and HEYDUDE brand performance, inventory, pricing and wholesale demand.",
    "question": "Why might inexpensive customization accessories increase the appeal of a basic shoe?",
    "source": "https://investors.crocs.com/"
  },
  "COLM": {
    "overview": "Columbia Sportswear designs outdoor apparel, footwear and accessories for different activities and price points.",
    "products": "Columbia, SOREL, Mountain Hardwear and prAna.",
    "customers": "Hikers, outdoor enthusiasts, winter-weather shoppers and retail partners.",
    "businessModel": "Apparel, footwear and accessory sales through wholesale and direct channels.",
    "insight": "Weather and seasonal demand influence product mix, while multiple brands cover different outdoor activities.",
    "watch": "Wholesale orders, winter demand, international markets and inventory.",
    "question": "Why could an unusually warm winter affect an outdoor apparel company's sales mix?",
    "source": "https://investor.columbia.com/"
  },
  "ONON": {
    "overview": "On Holding is a Swiss sportswear company known for running footwear and expanding athletic apparel.",
    "products": "On running shoes, CloudTec cushioning and On apparel.",
    "customers": "Runners, active lifestyle shoppers and specialty retail partners.",
    "businessModel": "Premium footwear, apparel and accessory sales through direct and wholesale channels.",
    "insight": "Distinctive cushioning design helps differentiate the product, while retail expansion increases reach and inventory needs.",
    "watch": "Footwear demand, new models, store expansion, gross margin and supply chain.",
    "question": "What must a premium running shoe demonstrate beyond a recognizable appearance?",
    "source": "https://investors.on-running.com/"
  },
  "VFC": {
    "overview": "VF Corporation owns apparel and footwear brands serving outdoor and lifestyle markets.",
    "products": "The North Face, Vans and Timberland.",
    "customers": "Outdoor customers, skateboard and lifestyle shoppers, and retail partners.",
    "businessModel": "Brand product sales through wholesale and direct channels.",
    "insight": "Its brands have different customer communities, so a slowdown in one brand need not reflect the same trend across all brands.",
    "watch": "Brand-by-brand sales, debt, inventory and turnaround execution.",
    "question": "Why should an investor inspect each brand instead of judging a parent company by only one popular label?",
    "source": "https://www.vfc.com/investors"
  },
  "PVH": {
    "overview": "PVH is a global apparel company centered on two major fashion brands.",
    "products": "Calvin Klein and Tommy Hilfiger.",
    "customers": "Fashion shoppers, department stores, franchisees and licensing partners.",
    "businessModel": "Wholesale and direct product sales, plus licensing and related brand arrangements.",
    "insight": "Brand identity can be monetized across apparel and other categories, but consistency matters when products are sold by many partners.",
    "watch": "Calvin Klein and Tommy Hilfiger demand, regional sales, margins and licensing.",
    "question": "How does licensing help a brand appear on products outside its core clothing business?",
    "source": "https://www.pvh.com/investors"
  },
  "BIRK": {
    "overview": "Birkenstock Holding markets premium footwear associated with its contoured footbed.",
    "products": "Arizona sandals, Boston clogs and Birkenstock footbed designs.",
    "customers": "Comfort-footwear and fashion consumers, plus retail partners.",
    "businessModel": "Footwear sales through wholesale and direct channels.",
    "insight": "Its product identity rests on recognizable fit and construction; demand can span comfort use and fashion cycles.",
    "watch": "Production capacity, product mix, wholesale relationships and pricing.",
    "question": "How can a functional design feature become a recognizable fashion signature?",
    "source": "https://www.birkenstock-holding.com/investor-relations/"
  },
  "TPR": {
    "overview": "Tapestry is a parent company operating accessible-luxury fashion and accessories brands.",
    "products": "Coach and kate spade new york.",
    "customers": "Handbag, accessory and fashion shoppers across several markets.",
    "businessModel": "Sales of handbags, leather goods and other products through direct and wholesale channels.",
    "insight": "The parent allocates resources across distinct brands, while each brand needs its own positioning and customer loyalty.",
    "watch": "Coach and kate spade trends, international demand, pricing and margins.",
    "question": "Why should two handbag brands under one owner maintain different styles and identities?",
    "source": "https://www.tapestry.com/investors/"
  },
  "ASO": {
    "overview": "Academy Sports + Outdoors operates sporting-goods and outdoor retail stores rather than primarily manufacturing its own products.",
    "products": "Academy stores, sports equipment, footwear, outdoor gear and private-label merchandise.",
    "customers": "Families, athletes, hunters, anglers and recreational shoppers.",
    "businessModel": "Retail sales of branded and private-label merchandise.",
    "insight": "Its assortment serves many sports and outdoor activities; private-label products can offer different pricing and margins from national brands.",
    "watch": "Store traffic, comparable sales, new stores, seasonal demand and inventory.",
    "question": "How is Academy's business model different from Nike's even when both sell athletic shoes?",
    "source": "https://investors.academy.com/"
  },
  "CELH": {
    "overview": "Celsius Holdings is a beverage company included in this broader consumer-brand category, not an apparel maker.",
    "products": "CELSIUS energy drinks and its beverage portfolio.",
    "customers": "Energy-drink consumers, convenience stores, grocery chains and distributors.",
    "businessModel": "Sales of packaged beverages through retail and distribution networks.",
    "insight": "Shelf space, distribution reach and repeat purchases matter: a brand can gain recognition yet still need reliable store availability.",
    "watch": "Retail sales velocity, distribution, competition, promotional spending and beverage margins.",
    "question": "Why is gaining space in convenience-store refrigerators important to an energy-drink brand?",
    "source": "https://ir.celsiusholdingsinc.com/"
  }
};
  const revenueModels={AAPL:"Device sales and recurring services",MSFT:"Software subscriptions, cloud computing and licenses",NVDA:"AI and graphics chips, systems and networking",GOOGL:"Advertising, cloud services and subscriptions",META:"Advertising across its apps",AMZN:"Retail, seller fees, AWS, advertising and subscriptions",TSM:"Contract chip manufacturing for chip designers",PLTR:"Government and commercial software contracts",CRWD:"Cybersecurity subscriptions",PANW:"Security products, subscriptions and support",V:"Payment-network service fees, not primarily cardholder lending",MA:"Payment-network and related service fees",JPM:"Loan interest and banking and investment fees",KO:"Beverage concentrate and finished-drink sales",PEP:"Beverage and packaged-food sales",MCD:"Franchise royalties, rent and restaurant sales",NFLX:"Subscriptions and advertising",SPOT:"Premium subscriptions and advertising",DIS:"Entertainment, streaming, parks and licensing",TSLA:"Vehicles, energy storage and services",UBER:"Fees from rides, delivery and freight",DASH:"Delivery fees, subscriptions and advertising",LLY:"Prescription medicine sales",ISRG:"Surgical systems, instruments and services",XOM:"Oil, gas, refining and chemicals",CEG:"Electricity and energy-product sales",CAT:"Machinery, parts, services and financing",NKE:"Footwear and apparel sales",O:"Rent from commercial tenants",PLD:"Rent from logistics properties",LMT:"Defense and aerospace contracts"};
  const industryRevenue={technology:"Technology products, software subscriptions or services",retail:"Merchandise, memberships or marketplace services",transport:"Vehicles, fares, delivery or related services",food:"Food and beverage sales, distribution or franchise fees",media:"Subscriptions, advertising, licensing or experiences",finance:"Interest, transactions or financial-service fees",health:"Medicines, devices, care or healthcare services",energy:"Energy, industrial equipment or project contracts",brands:"Branded merchandise sold directly or wholesale",housing:"Homes, materials, rent or property services",defense:"Government and commercial contracts"};
  // Editorially checked, dated stories. No generated headline is presented as verified news.
  const verifiedNews={
    AMD:{date:"2026-09-21",title:"AMD reaches a $1 trillion market value amid AI-computing demand",context:"Its expansion into AI systems and server processors is relevant to how it competes for data-center spending.",url:"https://www.reuters.com/business/amd-becomes-latest-chipmaker-reach-1-trillion-valuation-ai-demand-2026-09-21/"},
    META:{date:"2026-09-24",title:"Meta's AI-device launch draws attention to its hardware strategy",context:"Students can compare the device business with Meta's much larger advertising model; a product launch is not proof of long-term profitability.",url:"https://www.fidelity.com/news/article/us-markets/202609240311RTRSNEWSCOMBINED_L1N45G06Q_1"},
    ORCL:{date:"2026-09-24",title:"Oracle shares slip amid a reported data-center project issue",context:"Cloud capacity projects can involve construction, power, financing and contractual risks. Check the underlying report before attributing a price move.",url:"https://www.fidelity.com/news/article/us-markets/202609241600RTRSNEWSCOMBINED_L6N45G17A_1"}
  };
  function newsBlock(c){
    const n=verifiedNews[c.ticker];
    const q=encodeURIComponent(''+c.name+' '+c.ticker+' stock news when:7d');
    return '<div class="passport-background"><h4>Recent company news</h4>'+(n?'<p><strong>'+esc(n.date)+' · '+esc(n.title)+'</strong></p><p>'+esc(n.context)+'</p><a href="'+esc(n.url)+'" target="_blank" rel="noopener noreferrer">Read the reported story ↗</a>':'<p>No individually verified story has been added to this passport yet.</p>')+'<p><a href="https://www.google.com/search?tbm=nws&q='+q+'" target="_blank" rel="noopener noreferrer">Search recent '+esc(c.ticker)+' news ↗</a></p><small>News links are for research, not a claim that the story caused the latest price change.</small></div>';
  }
  function companyExplainer(c){
    const industry=c.industries?.find(i=>!i.optional)||c.industries?.[0]||{id:"",name:"Business"};
    const brandResearch=brandProfiles[c.ticker];
    if(brandResearch && c.industries?.some(i=>i.id==="brands")) return {overview:brandResearch.overview,revenue:"Recognizable brands / products: "+brandResearch.products+".",businessModel:brandResearch.businessModel,importance:"Customers: "+brandResearch.customers+". Why it matters: "+brandResearch.insight+" What to watch: "+brandResearch.watch,product:brandResearch.products,customers:brandResearch.customers,watch:brandResearch.watch,examples:brandResearch.products,verified:true,source:brandResearch.source,question:brandResearch.question};
    const housingResearch=housingProfiles[c.ticker];
    if(housingResearch && c.industries?.some(i=>i.id==="housing")) return {overview:housingResearch.overview,revenue:"Recognizable products / properties: "+housingResearch.products+".",businessModel:housingResearch.businessModel,importance:"Customers: "+housingResearch.customers+". Why it matters: "+housingResearch.insight+" What to watch: "+housingResearch.watch,product:housingResearch.products,customers:housingResearch.customers,watch:housingResearch.watch,examples:housingResearch.products,verified:true,source:housingResearch.source,question:housingResearch.question};
    const retailResearch=retailProfiles[c.ticker];
    if(retailResearch && c.industries?.some(i=>i.id==="retail")) return {overview:retailResearch.overview,revenue:"Recognizable products / brands: "+retailResearch.products+".",businessModel:retailResearch.businessModel,importance:"Why it matters: "+retailResearch.insight+" What to watch: "+retailResearch.watch,product:retailResearch.products,customers:"See company filings",watch:retailResearch.watch,examples:retailResearch.products,verified:true,source:retailResearch.source};
    const researched=defenseProfiles[c.ticker];
    if(researched && c.industries?.some(i=>i.id==="defense")) return {overview:researched.overview,revenue:"Recognizable products / brands: "+researched.products+".",businessModel:researched.businessModel,importance:"Why it matters: "+researched.insight+" What to watch: "+researched.watch,product:researched.products,customers:"See company filings",watch:researched.watch,examples:researched.products,verified:true,source:researched.source};
    const detail=detailedProfiles[c.ticker]||additionalProfiles[c.ticker];
    const guide=industryGuides[industry.id]||["products and services","customers","demand and costs"];
    const product=detail?.[0]||companyHighlights[c.ticker]||guide[0];
    const customers=detail?.[1]||guide[1];
    const watch=detail?.[2]||guide[2];
    const examples=recognizableExamples[c.ticker]||product;
    const overview=c.name+" is a "+industry.name.toLowerCase()+" company focused on "+product+".";
    const revenue="Recognizable products / brands: "+examples+".";
    const businessModel=revenueModels[c.ticker]||("Revenue comes from "+product+" sold to "+customers+". Investigate its latest annual report to see the exact revenue mix.");
    const importance="Business context: Its customers include "+customers+". An important factor for this company is "+watch+".";
    return {overview,revenue,businessModel,importance,product,customers,watch,examples,verified:!!detail};
  }
  Object.assign(officialSites,{LMT:"lockheedmartin.com",RTX:"rtx.com",NOC:"northropgrumman.com",GD:"gd.com",LHX:"l3harris.com",HII:"hii.com",BA:"boeing.com",HWM:"howmet.com",AVAV:"avinc.com",AXON:"axon.com",PLTR:"palantir.com",GE:"geaerospace.com",HON:"honeywell.com"});
  Object.assign(officialSites,{AMZN:"amazon.com",WMT:"walmart.com",TGT:"target.com",COST:"costco.com",HD:"homedepot.com",LOW:"lowes.com",BBY:"bestbuy.com",EBAY:"ebay.com",ETSY:"etsy.com",CHWY:"chewy.com",BABA:"alibabagroup.com",MELI:"mercadolibre.com",ROST:"rossstores.com",TJX:"tjx.com"});
  window.STOCK_LAB_PROFILE_DATA={industryGuides,detailedProfiles,additionalProfiles,companyHighlights,officialSites,companyExplainer,defenseProfiles,retailProfiles,housingProfiles,brandProfiles};
  function passportBackground(c){
    const info=companyExplainer(c);
    return '<div class="passport-background"><h4>What this company does</h4><p>'+esc(info.overview)+'</p><h4>Products and brands</h4><p>'+esc(info.revenue)+'</p><h4>How it earns revenue</h4><p>'+esc(info.businessModel)+'</p><h4>Company context</h4><p>'+esc(info.importance)+'</p><h4>Student research checklist</h4><ul><li>What product or service does it sell?</li><li>Who pays for it?</li><li>Who competes with it?</li><li>What do its latest revenue and profit figures show?</li></ul>'+(info.question?'<p><strong>Company-specific research question:</strong> '+esc(info.question)+'</p>':'')+'<p class="passport-disclaimer">Introductory company-specific business context, not a live news report or financial recommendation. Check company filings for updated figures.</p>'+(info.source?'<p><a href="'+esc(info.source)+'" target="_blank" rel="noopener noreferrer">Read company annual reports / investor relations ↗</a></p>':'')+'</div>';
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
    const info=companyExplainer(c);
    return '<article class="stock-card'+(open?' expanded':'')+'"><div class="stock-card-top"><div><span class="stock-symbol">'+esc(c.ticker)+'</span>'+(assigned?'<span class="owned-chip">In your portfolio</span>':'')+'</div><span class="stock-date">'+esc(m.asOf||marketMeta.asOf||"Awaiting data")+'</span></div><h3>'+esc(c.name)+'</h3><p class="stock-sector">'+esc(label)+'</p><div class="stock-quick-profile"><p>'+esc(info.overview)+'</p><strong>Products and brands</strong><p>'+esc(info.revenue)+'</p><strong>How it earns revenue</strong><p>'+esc(info.businessModel)+'</p><strong>Company context</strong><p>'+esc(info.importance)+'</p></div><div class="stock-price-line"><strong>'+ (valid?fmt(m.price):"Price unavailable")+'</strong><span class="'+className+'">'+(movement?(pct>0?"+":"")+pct.toFixed(2)+"%":"No verified change")+'</span></div><div class="stock-card-metrics"><div><small>Previous close</small><b>'+(prior>0?fmt(prior):"—")+'</b></div><div><small>Day change</small><b class="'+className+'">'+(Number.isFinite(delta)&&valid?(delta>0?"+":"")+fmt(delta):"—")+'</b></div></div><div class="stock-card-actions"><button type="button" class="secondary" data-research="'+esc(c.ticker)+'" aria-expanded="'+open+'">'+(open?"Close passport":"Company passport")+'</button></div>'+(open?'<div class="stock-passport"><p class="eyebrow">COMPANY PASSPORT</p><div class="passport-facts"><div><small>Company</small><strong>'+esc(c.name)+'</strong></div><div><small>Ticker</small><strong>'+esc(c.ticker)+'</strong></div><div><small>Market data</small><strong>'+esc(m.source||marketMeta.source||"Awaiting Sheet")+'</strong></div><div><small>As of</small><strong>'+esc(m.asOf||marketMeta.asOf||"—")+'</strong></div></div>'+passportBackground(c)+newsBlock(c)+'<div class="stock-links">'+companyWebsite(c)+'<a href="https://www.google.com/search?q='+encodeURIComponent(c.ticker+" "+c.name+" stock investor relations")" target="_blank" rel="noopener noreferrer">Research ticker ↗</a><a href="https://www.sec.gov/edgar/search/#/q='+encodeURIComponent(c.name)+'" target="_blank" rel="noopener noreferrer">SEC filings ↗</a></div><p class="stock-footnote">Market prices are the latest available completed close, not live quotes. Check the listing exchange when researching externally.</p><button type="button" class="primary" data-rpick="'+esc(c.industries.find(i=>!i.optional)?.id||c.industries[0].id)+'" '+(window.STOCK_LAB_TRADING_ENABLED===true?"":"disabled")+'>'+(window.STOCK_LAB_TRADING_ENABLED===true?"Compare / Choose":"Portfolio selections not yet open")+'</button></div>':'')+'</article>';
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
  window.STOCK_LAB_RENDER_RESEARCH=draw;
  renderResearch=draw;
  draw();
})();
