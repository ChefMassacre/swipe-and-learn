// Re-saves every approved image in the standard format (1200x900, 4:3), so all
// cards look consistent. Approving on the review page already does this; run
// it after changing the rules in lib.mjs, or on images approved before it existed.
//   npm run images:normalize
//   npm run images:normalize -- --only=consoles
import { loadCards, filterCards, readManifest, writeManifest, writeGeneratedTs, findFile, assetFile, normalizeImage, ASSETS } from './lib.mjs';
import fs from 'node:fs';
import path from 'node:path';

const cards = filterCards(await loadCards());
const manifest = readManifest();
const todo = cards.filter((c) => manifest[c.id]?.status === 'approved' && assetFile(c.id));
console.log(`Standardising ${todo.length} approved images…`);

const low = [];
for (const card of todo) {
  const m = manifest[card.id];
  // Start from the full-size version in the work folder when it's there.
  const src = (m.choice && findFile(m.choice, card.id)) || assetFile(card.id);
  const tmp = path.join(ASSETS, `.${card.id}.tmp.jpg`);
  try {
    const q = await normalizeImage(src, tmp, { kind: card.keepOriginal ? 'exact' : 'auto' });
    const old = assetFile(card.id);
    if (old) fs.unlinkSync(old);
    fs.renameSync(tmp, path.join(ASSETS, card.id + '.jpg'));
    m.quality = q;
    if (q.lowRes) low.push(card.id);
    console.log(`  ✓ ${card.id.padEnd(22)} ${q.mode}${q.lowRes ? '  (low resolution)' : ''}`);
  } catch (e) {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    console.log(`  ✗ ${card.id}  ${e.message}`);
    if (/sharp/.test(e.message)) process.exit(1);
  }
}
writeManifest(manifest);
writeGeneratedTs(manifest);
if (low.length) console.log(`\nLow resolution (may look soft, consider a bigger picture):\n  ${low.join('\n  ')}`);
console.log('\nDone. Check them all at once in the Gallery tab: npm run images:review');
