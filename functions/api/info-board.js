// Same-origin proxy for the dedicated MRDHQ Info Board Apps Script.
// Apps Script's cross-origin redirects are not reliably readable by browser fetch.
const UPSTREAM = 'https://script.google.com/a/macros/casdonline.org/s/AKfycbyqhx-J_Z2qIc_qfKd9gpV3rS3nhh2B8eEle56fMsx42vQoqOw75FY3GONnggSGxgI/exec';
const reply = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function onRequest({request}) {
  if(request.method!=='GET'&&request.method!=='POST') return reply({success:false,error:'Method not allowed'},405);
  try {
    let url=UPSTREAM, options={method:request.method,redirect:'follow',headers:{Accept:'application/json'}};
    if(request.method==='GET'){
      const action=new URL(request.url).searchParams.get('action')||'infoBoardGet';
      if(action!=='infoBoardGet') return reply({success:false,error:'Unknown action'},400);
      url+='?action='+encodeURIComponent(action);
    } else {
      const body=await request.text();
      if(body.length>12000) return reply({success:false,error:'Request too large'},413);
      options.body=body;options.headers['Content-Type']='application/x-www-form-urlencoded;charset=UTF-8';
    }
    const upstream=await fetch(url,options);
    const raw=await upstream.text();
    let data;
    try {data=JSON.parse(raw)}catch(_){return reply({success:false,error:'Apps Script returned a non-JSON response. Check web app deployment access and execute-as settings.'},502)}
    return reply(data,upstream.ok?200:502);
  } catch(e) {return reply({success:false,error:'Info Board backend temporarily unavailable.'},502)}
}
