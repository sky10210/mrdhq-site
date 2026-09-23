/**
 * MRDHQ Info Board Worker.
 * Deploy as a standalone Cloudflare Worker; do not deploy to GitHub Pages.
 * Set the Worker secret INFO_BOARD_UPSTREAM to the deployed Apps Script /exec URL.
 * Route: https://mrdhq.com/api/info-board* (requires proxied Cloudflare DNS).
 */
const ORIGINS = new Set(['https://mrdhq.com','https://www.mrdhq.com']);
function json(data,status=200,origin=''){
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(ORIGINS.has(origin)){headers['Access-Control-Allow-Origin']=origin;headers['Vary']='Origin';}
  return new Response(JSON.stringify(data),{status,headers});
}
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin')||'';
  const url=new URL(request.url);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':ORIGINS.has(origin)?origin:'https://mrdhq.com','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'86400','Vary':'Origin'}});
  if(!['GET','POST'].includes(request.method))return json({success:false,error:'Method not allowed'},405,origin);
  if(!env.INFO_BOARD_UPSTREAM)return json({success:false,error:'Worker upstream not configured'},503,origin);
  if(request.method==='POST'&&origin&&!ORIGINS.has(origin))return json({success:false,error:'Origin not allowed'},403,origin);
  try {
   const target=new URL(env.INFO_BOARD_UPSTREAM);
   const options={method:request.method,redirect:'follow',headers:{'Accept':'application/json'}};
   if(request.method==='GET'){
    const action=url.searchParams.get('action')||'infoBoardGet';
    if(action!=='infoBoardGet')return json({success:false,error:'Invalid action'},400,origin);
    target.searchParams.set('action',action);
   }else{
    const body=await request.text();
    if(body.length>12000)return json({success:false,error:'Request too large'},413,origin);
    options.body=body;options.headers['Content-Type']='application/x-www-form-urlencoded;charset=UTF-8';
   }
   const response=await fetch(target.toString(),options);
   const raw=await response.text();
   let data;
   try{data=JSON.parse(raw)}catch(_){return json({success:false,error:'Apps Script returned non-JSON. Check deployment access and execute-as settings.'},502,origin);}
   return json(data,response.ok?200:502,origin);
  }catch(_){return json({success:false,error:'Info Board upstream unavailable'},502,origin);}
 }
};
