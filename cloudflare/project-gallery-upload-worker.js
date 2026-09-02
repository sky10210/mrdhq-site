export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    if (request.method === 'OPTIONS') return new Response(null,{headers:cors});
    if (request.method !== 'POST') return new Response(JSON.stringify({success:false,error:'POST only'}),{status:405,headers:{...cors,'Content-Type':'application/json'}});
    try {
      const data = await request.json();
      const imageData = String(data.imageData || '');
      const projectId = String(data.projectId || 'project').replace(/[^a-z0-9_-]/gi,'-');
      const contentType = String(data.imageType || 'image/jpeg');
      if (!imageData) throw new Error('Missing image data.');
      const binary = Uint8Array.from(atob(imageData.replace(/^data:[^;]+;base64,/,'')), c => c.charCodeAt(0));
      if (binary.byteLength > 6 * 1024 * 1024) throw new Error('Image is too large.');
      const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
      const key = `${projectId}/${crypto.randomUUID()}.${ext}`;
      await env.GALLERY_BUCKET.put(key, binary, {httpMetadata:{contentType,cacheControl:'public, max-age=31536000'}});
      const publicUrl = `${env.R2_PUBLIC_BASE.replace(/\/$/,'')}/${key}`;
      return new Response(JSON.stringify({success:true,key,publicUrl}),{headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
    } catch (err) {
      return new Response(JSON.stringify({success:false,error:String(err?.message || err)}),{status:400,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
    }
  }
};
