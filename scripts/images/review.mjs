// Step 3: review page. Opens in your browser at http://localhost:5179
// For every card you choose the AI-cleaned image, the original, your own upload,
// or hide the card. Approved images are copied into assets/cards and listed in
// src/data/cardImages.ts, which ship with the app.
//   npm run images:review
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import {
  loadCards, readManifest, writeManifest, findFile, fetchOriginal, cleanImage, approve, unapprove,
  writeGeneratedTs, removeExisting, extFor, DIRS,
} from './lib.mjs';

const PORT = Number(process.env.PORT || 5179);
const cards = await loadCards();
const byId = new Map(cards.map((c) => [c.id, c]));
let manifest = readManifest();
writeGeneratedTs(manifest);

const json = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};
const readBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

function cardData() {
  return cards.map((c) => {
    const m = manifest[c.id] ?? {};
    const v = (kind) => {
      const f = findFile(kind, c.id);
      return f ? `/img/${kind}/${c.id}?t=${Math.floor(fs.statSync(f).mtimeMs)}` : null;
    };
    return {
      id: c.id, answer: c.answer, topic: `${c.topicEmoji} ${c.topicTitle}`, topicId: c.topicId, wiki: c.wiki,
      status: m.status ?? 'pending', choice: m.choice ?? null, note: m.note ?? '',
      credit: m.credit, license: m.license, sourceUrl: m.sourceUrl, nonFree: !!m.nonFree,
      original: v('original'), cleaned: v('cleaned'), custom: v('custom'),
    };
  });
}

function save() {
  writeManifest(manifest);
  writeGeneratedTs(manifest);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(PAGE);
    }
    if (req.method === 'GET' && url.pathname === '/data') return json(res, 200, cardData());

    const img = url.pathname.match(/^\/img\/(original|cleaned|custom)\/([\w-]+)$/);
    if (req.method === 'GET' && img) {
      const f = findFile(img[1], img[2]);
      if (!f) return json(res, 404, { error: 'not found' });
      const type = { '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' }[path.extname(f)] ?? 'image/jpeg';
      res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
      return fs.createReadStream(f).pipe(res);
    }

    if (req.method === 'POST' && url.pathname === '/upload') {
      const id = url.searchParams.get('id');
      if (!byId.has(id)) return json(res, 400, { error: 'unknown card' });
      const body = await readBody(req);
      removeExisting('custom', id);
      fs.writeFileSync(path.join(DIRS.custom, id + extFor(req.headers['content-type'] ?? '')), body);
      return json(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/action') {
      const { id, action, note, credit, license } = JSON.parse((await readBody(req)).toString() || '{}');
      const card = byId.get(id);
      if (!card) return json(res, 400, { error: 'unknown card' });
      const m = (manifest[id] ??= { status: 'pending' });

      if (action === 'fetch') Object.assign(m, await fetchOriginal(card));
      else if (action === 'clean') {
        m.note = note ?? m.note ?? '';
        await cleanImage(card, m.note);
        if (m.status === 'approved' && m.choice === 'cleaned') m.status = 'pending';
      } else if (['cleaned', 'original', 'custom'].includes(action)) {
        approve(id, action);
        m.status = 'approved';
        m.choice = action;
        if (action === 'custom') {
          m.customCredit = credit || m.customCredit;
          m.customLicense = license || m.customLicense;
        }
      } else if (action === 'reject') {
        unapprove(id);
        m.status = 'rejected';
        m.choice = null;
      } else if (action === 'reset') {
        unapprove(id);
        m.status = 'pending';
        m.choice = null;
      } else return json(res, 400, { error: 'unknown action' });

      save();
      return json(res, 200, { ok: true });
    }
    json(res, 404, { error: 'not found' });
  } catch (e) {
    json(res, 500, { error: e.message });
  }
});

server.listen(PORT, () => {
  const u = `http://localhost:${PORT}`;
  console.log(`Review page: ${u}\nApproved images are saved as you click. Press Ctrl+C here when you're done.`);
  if (!process.env.NO_OPEN) {
    const cmd = process.platform === 'win32' ? `start "" ${u}` : process.platform === 'darwin' ? `open ${u}` : `xdg-open ${u}`;
    exec(cmd, () => {});
  }
});

const PAGE = /* html */ `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Swipe&amp;Learn image review</title>
<style>
  :root { --bg:#F6F5FB; --card:#fff; --ink:#16142B; --muted:#6B6987; --line:#E6E4F0; --primary:#6C4DF6; --ok:#16A34A; --bad:#E11D48; --warn:#B45309; }
  * { box-sizing: border-box; }
  body { margin:0; font:15px/1.4 system-ui, -apple-system, Segoe UI, sans-serif; background:var(--bg); color:var(--ink); }
  header { position:sticky; top:0; z-index:2; background:var(--bg); padding:16px 24px; border-bottom:1px solid var(--line); display:flex; gap:16px; align-items:center; flex-wrap:wrap; }
  h1 { font-size:20px; margin:0 12px 0 0; }
  select, button, input { font:inherit; }
  .tabs button { border:1px solid var(--line); background:var(--card); padding:6px 12px; border-radius:999px; cursor:pointer; }
  .tabs button.on { background:var(--ink); color:#fff; border-color:var(--ink); }
  main { padding:20px 24px; display:grid; gap:16px; }
  .card { background:var(--card); border-radius:16px; padding:16px; box-shadow:0 4px 14px #1b16400d; }
  .head { display:flex; gap:10px; align-items:baseline; flex-wrap:wrap; margin-bottom:10px; }
  .answer { font-weight:800; font-size:18px; }
  .muted { color:var(--muted); font-size:13px; }
  .pill { font-size:12px; font-weight:800; padding:2px 10px; border-radius:999px; text-transform:uppercase; }
  .pending { background:#FEF3C7; color:var(--warn); } .approved { background:#DCFCE7; color:var(--ok); } .rejected { background:#FFE4E6; color:var(--bad); }
  .versions { display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:12px; }
  .v { border:2px solid var(--line); border-radius:12px; padding:8px; display:flex; flex-direction:column; gap:8px; }
  .v.chosen { border-color:var(--ok); }
  .v img { width:100%; height:240px; object-fit:contain; background:#F1F0F7; border-radius:8px; }
  .v .empty { height:240px; display:flex; align-items:center; justify-content:center; background:#F1F0F7; border-radius:8px; color:var(--muted); text-align:center; padding:12px; }
  .v b { font-size:13px; }
  .btn { border:0; border-radius:10px; padding:8px 12px; font-weight:700; cursor:pointer; background:var(--primary); color:#fff; }
  .btn.sec { background:#EEEAFE; color:var(--primary); }
  .btn.bad { background:#FFE4E6; color:var(--bad); }
  .btn:disabled { opacity:.5; cursor:wait; }
  .row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-top:10px; }
  .row input[type=text] { flex:1; min-width:200px; padding:8px 10px; border:1px solid var(--line); border-radius:10px; }
  .err { color:var(--bad); font-weight:700; }
</style></head>
<body>
<header>
  <h1>Card image review</h1>
  <div class="tabs" id="tabs"></div>
  <select id="topic"><option value="">All topics</option></select>
  <span class="muted" id="count"></span>
</header>
<main id="list"></main>
<script>
let cards = [], filter = 'pending', topic = '';
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

async function load() {
  cards = await (await fetch('/data')).json();
  const topics = [...new Map(cards.map(c => [c.topicId, c.topic])).entries()];
  $('#topic').innerHTML = '<option value="">All topics</option>' + topics.map(([id, t]) => '<option value="'+id+'"'+(id===topic?' selected':'')+'>'+esc(t)+'</option>').join('');
  render();
}

function render() {
  const counts = { pending:0, approved:0, rejected:0, all:cards.length };
  cards.forEach(c => counts[c.status]++);
  $('#tabs').innerHTML = ['pending','approved','rejected','all'].map(f => '<button class="'+(f===filter?'on':'')+'" onclick="setFilter(\\''+f+'\\')">'+f[0].toUpperCase()+f.slice(1)+' ('+counts[f]+')</button>').join(' ');
  const shown = cards.filter(c => (filter==='all' || c.status===filter) && (!topic || c.topicId===topic));
  $('#count').textContent = shown.length + ' shown';
  $('#list').innerHTML = shown.map(cardHtml).join('') || '<p class="muted">Nothing here.</p>';
}

function version(c, kind, label) {
  const src = c[kind];
  const chosen = c.status === 'approved' && c.choice === kind;
  let body;
  if (src) body = '<img src="'+src+'" alt="'+label+'">';
  else if (kind === 'original') body = '<div class="empty">No picture yet<br><button class="btn sec" onclick="act(this,\\''+c.id+'\\',\\'fetch\\')">Download from Wikipedia</button></div>';
  else if (kind === 'cleaned') body = '<div class="empty">'+(c.original ? 'Not cleaned yet<br><button class="btn sec" onclick="act(this,\\''+c.id+'\\',\\'clean\\')">Clean with AI</button>' : 'Download the original first')+'</div>';
  else body = '<div class="empty">Upload your own picture<br><input type="file" accept="image/*" onchange="upload(this,\\''+c.id+'\\')"></div>';
  return '<div class="v'+(chosen?' chosen':'')+'"><b>'+label+(chosen?' ✓ in the app':'')+'</b>'+body+
    (src ? '<button class="btn" '+(chosen?'disabled':'')+' onclick="act(this,\\''+c.id+'\\',\\''+kind+'\\')">Use this one</button>' : '')+
    (src && kind==='custom' ? '<input type="file" accept="image/*" onchange="upload(this,\\''+c.id+'\\')">' : '')+'</div>';
}

function cardHtml(c) {
  return '<section class="card" id="'+c.id+'">'+
    '<div class="head"><span class="answer">'+esc(c.answer)+'</span><span class="pill '+c.status+'">'+c.status+'</span>'+
    '<span class="muted">'+esc(c.topic)+' · '+esc(c.id)+'</span></div>'+
    (c.credit ? '<div class="muted">Original: '+esc(c.credit)+' · '+esc(c.license)+(c.sourceUrl ? ' · <a href="'+esc(c.sourceUrl)+'" target="_blank">source</a>' : '')+'</div>' : '')+
    (c.nonFree ? '<div class="err">This image is not freely licensed. Upload a different picture.</div>' : '')+
    '<p class="muted">Check: does any version show the answer\\'s name, logo or model number? Is anything important changed or warped (faces, shapes)?</p>'+
    '<div class="versions">'+version(c,'cleaned','AI-cleaned')+version(c,'original','Original')+version(c,'custom','Your upload')+'</div>'+
    '<div class="row"><input type="text" id="note-'+c.id+'" placeholder="Extra instructions for the AI, e.g. also remove the sticker on the left" value="'+esc(c.note)+'">'+
    '<button class="btn sec" '+(c.original?'':'disabled')+' onclick="act(this,\\''+c.id+'\\',\\'clean\\')">Clean again</button>'+
    (c.status!=='pending' ? '<button class="btn sec" onclick="act(this,\\''+c.id+'\\',\\'reset\\')">Back to pending</button>' : '')+
    (c.status!=='rejected' ? '<button class="btn bad" onclick="act(this,\\''+c.id+'\\',\\'reject\\')">Hide this card</button>' : '')+
    '<span class="err" id="err-'+c.id+'"></span></div></section>';
}

function setFilter(f) { filter = f; render(); }
$('#topic').onchange = (e) => { topic = e.target.value; render(); };

async function act(btn, id, action) {
  btn.disabled = true; const old = btn.textContent;
  if (action === 'clean' || action === 'fetch') btn.textContent = 'Working…';
  const body = { id, action };
  if (action === 'clean') body.note = document.getElementById('note-'+id)?.value || '';
  if (action === 'custom') {
    body.credit = prompt('Who made this picture? (shown as the photo credit)', 'Swipe&Learn') || '';
    body.license = prompt('License (e.g. CC BY-SA 4.0, or "Own photo")', 'Own photo') || '';
  }
  const res = await fetch('/action', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body) });
  const out = await res.json();
  if (!res.ok) { btn.disabled = false; btn.textContent = old; document.getElementById('err-'+id).textContent = out.error; return; }
  await load();
}

async function upload(input, id) {
  const f = input.files[0]; if (!f) return;
  const res = await fetch('/upload?id='+id, { method:'POST', headers:{'content-type': f.type}, body: f });
  if (!res.ok) { document.getElementById('err-'+id).textContent = 'Upload failed'; return; }
  await load();
}

load();
</script>
</body></html>`;
