// Shared helpers for the card image pipeline. Node 22+ only, no dependencies.
// See docs/IMAGES.md for how to use it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const WORK = path.join(ROOT, 'content/images/work');
export const DIRS = {
  original: path.join(WORK, 'original'),
  cleaned: path.join(WORK, 'cleaned'),
  custom: path.join(WORK, 'custom'),
};
export const MANIFEST = path.join(ROOT, 'content/images/manifest.json');
export const ASSETS = path.join(ROOT, 'assets/cards');
export const GENERATED_TS = path.join(ROOT, 'src/data/cardImages.ts');
const UA = 'SwipeAndLearnImageTool/0.1 (https://github.com/ChefMassacre/swipe-and-learn)';

for (const d of [...Object.values(DIRS), ASSETS]) fs.mkdirSync(d, { recursive: true });

// ---------- content ----------

export async function loadCards() {
  const mod = await import(pathToFileURL(path.join(ROOT, 'src/data/topicsData.ts')).href);
  return mod.RAW_TOPICS.flatMap((t) => t.cards.map((c) => ({ ...c, topicId: t.id, topicTitle: t.title, topicEmoji: t.emoji })));
}

/** --only=consoles,phil-kant  -> filter by topic id or card id. */
export function filterCards(cards, argv = process.argv) {
  const only = argv.find((a) => a.startsWith('--only='))?.slice(7).split(',').filter(Boolean);
  return only?.length ? cards.filter((c) => only.includes(c.id) || only.includes(c.topicId)) : cards;
}
export const hasFlag = (f, argv = process.argv) => argv.includes(f);

// ---------- manifest ----------

export function readManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  } catch {
    return {};
  }
}
export function writeManifest(m) {
  const sorted = Object.fromEntries(Object.keys(m).sort().map((k) => [k, m[k]]));
  fs.writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + '\n');
}

/** Finds the file for a card in one of the work folders (any extension). */
export function findFile(kind, id) {
  const dir = DIRS[kind];
  const f = fs.readdirSync(dir).find((n) => n.replace(/\.[^.]+$/, '') === id);
  return f ? path.join(dir, f) : null;
}

export function extFor(contentType, fallback = '.jpg') {
  if (/png/.test(contentType)) return '.png';
  if (/webp/.test(contentType)) return '.webp';
  if (/jpe?g/.test(contentType)) return '.jpg';
  return fallback;
}

export function removeExisting(kind, id) {
  const f = findFile(kind, id);
  if (f) fs.unlinkSync(f);
}

// ---------- Wikipedia ----------

async function wikiApi(params) {
  const u = new URL('https://en.wikipedia.org/w/api.php');
  for (const [k, v] of Object.entries({ ...params, action: 'query', format: 'json', formatversion: '2' })) u.searchParams.set(k, v);
  const res = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Wikipedia API ${res.status}`);
  return res.json();
}

const stripHtml = (s = '') => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

/** Downloads the lead image of the card's Wikipedia article and records its credit and license. */
export async function fetchOriginal(card) {
  // pageimages only returns freely licensed images by default (no fair-use logos).
  const page = (await wikiApi({ titles: card.wiki, prop: 'pageimages', piprop: 'name', redirects: '1' })).query?.pages?.[0];
  if (!page || page.missing) throw new Error(`No Wikipedia article called "${card.wiki}"`);
  if (!page.pageimage) throw new Error(`"${card.wiki}" has no free lead image. Pick an image by hand (upload it on the review page).`);

  const file = (await wikiApi({ titles: `File:${page.pageimage}`, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1024' })).query?.pages?.[0];
  const info = file?.imageinfo?.[0];
  if (!info) throw new Error(`No image info for ${page.pageimage}`);
  const meta = info.extmetadata ?? {};
  const url = info.thumburl ?? info.url;

  const img = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!img.ok) throw new Error(`Image download ${img.status}`);
  removeExisting('original', card.id);
  const out = path.join(DIRS.original, card.id + extFor(img.headers.get('content-type') ?? '', path.extname(url) || '.jpg'));
  fs.writeFileSync(out, Buffer.from(await img.arrayBuffer()));

  return {
    wikiFile: page.pageimage,
    sourceUrl: info.descriptionurl,
    credit: stripHtml(meta.Artist?.value) || 'Unknown author',
    license: stripHtml(meta.LicenseShortName?.value) || 'See source',
    nonFree: meta.NonFree?.value === 'true',
  };
}

// ---------- AI clean-up ----------

export function loadEnv() {
  const f = path.join(ROOT, '.env');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

export const CLEAN_PROMPT = [
  'Edit this photo for a picture quiz, where players must guess what it shows without being told.',
  'Remove every piece of visible text that could give the answer away: brand names, logos, model names and numbers, labels, captions, watermarks and signatures.',
  'Fill each removed area so it matches the surrounding surface naturally, as if the text was never there.',
  'Change nothing else: keep the same object, shape, proportions, colors, materials, camera angle, background, lighting and framing.',
  "If there are people, do not change their faces or features at all.",
  'Do not add any new text, objects or borders.',
].join(' ');

/** Sends the original to the image model and saves the edited version. Needs OPENAI_API_KEY. */
export async function cleanImage(card, note = '') {
  loadEnv();
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not set. Add it to a .env file in the project folder (see docs/IMAGES.md).');
  const src = findFile('original', card.id);
  if (!src) throw new Error('No original image yet. Run the fetch step first.');

  const model = process.env.IMAGE_MODEL || 'gpt-image-1';
  const prompt = note ? `${CLEAN_PROMPT} Extra instructions: ${note}` : CLEAN_PROMPT;
  const mime = { '.png': 'image/png', '.webp': 'image/webp' }[path.extname(src)] ?? 'image/jpeg';

  const send = async (extras) => {
    const form = new FormData();
    form.append('model', model);
    form.append('prompt', prompt);
    form.append('image', new Blob([fs.readFileSync(src)], { type: mime }), path.basename(src));
    form.append('n', '1');
    form.append('size', 'auto');
    form.append('quality', process.env.IMAGE_QUALITY || 'medium');
    for (const [k, v] of Object.entries(extras)) form.append(k, v);
    return fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
  };

  let res = await send({ output_format: 'jpeg', output_compression: '85', input_fidelity: 'high' });
  if (res.status === 400) {
    // Some models don't accept the optional settings; try again with the basics.
    const body = await res.text();
    if (/output_format|output_compression|input_fidelity|unknown parameter/i.test(body)) res = await send({});
    else throw new Error(`OpenAI: ${body.slice(0, 300)}`);
  }
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI returned no image');
  const buf = Buffer.from(b64, 'base64');
  const ext = buf[0] === 0x89 ? '.png' : buf[0] === 0x52 ? '.webp' : '.jpg';
  removeExisting('cleaned', card.id);
  fs.writeFileSync(path.join(DIRS.cleaned, card.id + ext), buf);
}

// ---------- approval ----------

/** Copies the chosen version into assets/cards and regenerates src/data/cardImages.ts. */
export function approve(id, choice) {
  const src = findFile(choice, id);
  if (!src) throw new Error(`No ${choice} image for ${id}`);
  for (const f of fs.readdirSync(ASSETS)) if (f.replace(/\.[^.]+$/, '') === id) fs.unlinkSync(path.join(ASSETS, f));
  fs.copyFileSync(src, path.join(ASSETS, id + path.extname(src)));
}

export function unapprove(id) {
  for (const f of fs.readdirSync(ASSETS)) if (f.replace(/\.[^.]+$/, '') === id) fs.unlinkSync(path.join(ASSETS, f));
}

export function writeGeneratedTs(manifest) {
  const assets = new Map(fs.readdirSync(ASSETS).map((f) => [f.replace(/\.[^.]+$/, ''), f]));
  const approved = Object.entries(manifest).filter(([id, m]) => m.status === 'approved' && assets.has(id));
  const rejected = Object.entries(manifest).filter(([, m]) => m.status === 'rejected').map(([id]) => id);
  const q = (s) => JSON.stringify(s ?? '');
  const lines = [
    '// GENERATED by scripts/images/review.mjs. Do not edit by hand.',
    '// Approved card images that ship inside the app, with their credits.',
    '',
    'export type CardImage = { source: number; credit: string; license: string; sourceUrl: string; edited: boolean };',
    '',
    'export const CARD_IMAGES: Record<string, CardImage> = {',
    ...approved.map(([id, m]) => {
      const custom = m.choice === 'custom';
      return `  ${q(id)}: { source: require('../../assets/cards/${assets.get(id)}'), credit: ${q(custom ? m.customCredit || 'Swipe&Learn' : m.credit)}, license: ${q(custom ? m.customLicense || 'All rights reserved' : m.license)}, sourceUrl: ${q(custom ? '' : m.sourceUrl)}, edited: ${m.choice === 'cleaned'} },`;
    }),
    '};',
    '',
    `export const REJECTED_CARDS: string[] = ${JSON.stringify(rejected)};`,
    '',
  ];
  fs.writeFileSync(GENERATED_TS, lines.join('\n'));
}

export async function runPool(items, limit, fn) {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]);
  });
  await Promise.all(workers);
}
