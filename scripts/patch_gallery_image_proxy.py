from pathlib import Path

p = Path('marketing/project-gallery/index.html')
s = p.read_text(encoding='utf-8')

old = "function displayImageUrl(url){const s=String(url||'');const m=s.match(/[?&]id=([^&]+)/)||s.match(/\\/d\\/([^/]+)/);return m?'https://drive.google.com/thumbnail?id='+encodeURIComponent(m[1])+'&sz=w1600':s;}"
new = "function displayImageUrl(url){const s=String(url||'');const m=s.match(/[?&]id=([^&]+)/)||s.match(/\\/d\\/([^/]+)/);return m?'https://drive.google.com/thumbnail?id='+encodeURIComponent(m[1])+'&sz=w1600':s;}\nasync function loadPrivateGalleryImages(){const imgs=[...document.querySelectorAll('img[data-gallery-file-id]')];await Promise.all(imgs.map(async img=>{const fileId=img.dataset.galleryFileId;if(!fileId)return;try{const q=new URL(API);q.searchParams.set('action','image');q.searchParams.set('fileId',fileId);const d=await fetch(q).then(r=>r.json());if(d.success&&d.base64){img.src=`data:${d.mimeType||'image/jpeg'};base64,${d.base64}`;}}catch(err){console.warn('Gallery image load failed',err);}}));}"
if old not in s:
    raise SystemExit('displayImageUrl target not found')
s = s.replace(old, new, 1)

old_img = "${e.imageUrl?`<img src=\"${esc(displayImageUrl(e.imageUrl))}\" alt=\"Entry ${e.entryNumber}\" loading=\"lazy\">`:'<span>No image</span>'}"
new_img = "${e.imageFileId?`<img data-gallery-file-id=\"${esc(e.imageFileId)}\" src=\"\" alt=\"Entry ${e.entryNumber}\" loading=\"lazy\">`:e.imageUrl?`<img src=\"${esc(displayImageUrl(e.imageUrl))}\" alt=\"Entry ${e.entryNumber}\" loading=\"lazy\">`:'<span>No image</span>'}"
if old_img not in s:
    raise SystemExit('image markup target not found')
s = s.replace(old_img, new_img, 1)

needle = "$('gallery').innerHTML=html;"
if needle not in s:
    raise SystemExit('gallery render target not found')
s = s.replace(needle, needle + "loadPrivateGalleryImages();", 1)

p.write_text(s, encoding='utf-8')
print('patched', p)
# trigger 2026-09-01
