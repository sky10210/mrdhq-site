'use strict';
const wrap = (body, css = '') => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My webpage</title>
  <style>
${css}
  </style>
</head>
<body>
${body}
</html>`;
const examples = {
  cafe: wrap(`  <h1>Corner Café</h1>
  <p>Your study break starts here.</p>
  <h2>Our menu</h2>
  <ul>
    <li>Iced latte: $4</li>
    <li>Blueberry muffin: $3</li>
  </ul>
  <h2>Why choose us?</h2>
  <p>Fresh snacks, friendly faces, and space to relax.</p>
  <a href="#visit">Plan your visit</a>
  <h2 id="visit">Come say hello</h2>
  <p>Open Monday through Friday, 7 AM to 4 PM.</p>
</body>`, `    body { font-family: Arial, sans-serif; background: #fff7e8; color: #26354a; padding: 24px; line-height: 1.6; }
    h1 { color: #2f6fb5; }
    h2 { color: #18776f; }
    a { color: #2f6fb5; }`),
  basics: wrap(`  <h1>Hello, world!</h1>
  <p>This is my first webpage.</p>
  <h2>Three things about me</h2>
  <ul>
    <li>I enjoy creating things.</li>
    <li>I am learning HTML.</li>
    <li>I have a business idea.</li>
  </ul>
  <p>I can make <strong>important text</strong> stand out.</p>
</body>`),
  style: wrap(`  <h1>Make your brand stand out</h1>
  <p>Change the CSS above to give this page a new look.</p>
  <button>A sample button</button>
  <p>This button shows a style. It does not place an order.</p>
</body>`, `    body { background: #eaf3ff; color: #172033; font-family: Arial, sans-serif; padding: 24px; }
    h1 { color: #2f6fb5; font-size: 32px; }
    button { background: #18776f; color: white; padding: 12px 20px; border: 0; border-radius: 12px; }`),
  blank: wrap(`  <!-- Put your page content here. -->
  <h1>My page</h1>
</body>`)
};
const code = document.getElementById('code');
const preview = document.getElementById('preview');
const picker = document.getElementById('example');
const status = document.getElementById('status');
const key = 'mrdhq-coding-basics-v1';
let active = 'cafe';
let saveTimer;
function save() {
  try { localStorage.setItem(key, JSON.stringify({code: code.value, example: active})); status.textContent = 'Saved in this browser.'; }
  catch (_) { status.textContent = 'Browser saving unavailable. Download your HTML.'; }
}
function run() { preview.srcdoc = code.value; save(); }
function loadExample(name) {
  if (code.value !== examples[active] && !window.confirm('Replace your current code? Download it first if you want to keep a copy.')) return;
  active = name; picker.value = active; code.value = examples[active]; run();
}
code.value = examples.cafe;
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved && typeof saved.code === 'string' && Object.hasOwn(examples, saved.example)) {
    active = saved.example; picker.value = active; code.value = saved.code;
  }
} catch (_) { /* Use the starter if browser storage is unavailable. */ }
run();
document.getElementById('run').addEventListener('click', run);
document.getElementById('load').addEventListener('click', () => loadExample(picker.value));
document.getElementById('reset').addEventListener('click', () => loadExample(active));
code.addEventListener('input', () => { status.textContent = 'Changes pending. Run Code to update preview.'; clearTimeout(saveTimer); saveTimer = setTimeout(save, 400); });
code.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); } });
window.addEventListener('pagehide', save);
document.getElementById('download').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([code.value], {type: 'text/html;charset=utf-8'}));
  const a = document.createElement('a'); a.href = url; a.download = 'index.html'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000); status.textContent = 'HTML download requested.';
});
