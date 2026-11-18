// Step 1: download each card's picture from Wikipedia, with its credit and license.
//   npm run images:fetch                 (only cards without a picture yet)
//   npm run images:fetch -- --only=consoles,phil-kant
//   npm run images:fetch -- --force      (download again)
import { loadCards, filterCards, hasFlag, readManifest, writeManifest, findFile, fetchOriginal, runPool } from './lib.mjs';

let cards;
try {
  cards = filterCards(await loadCards());
} catch (e) {
  console.error('Could not read the card list (src/data/topicsData.ts). Run this from the app folder, the one with package.json.\n', e.message);
  process.exit(1);
}
const manifest = readManifest();
const force = hasFlag('--force');
const todo = cards.filter((c) => force || !findFile('original', c.id));
console.log(`Fetching ${todo.length} of ${cards.length} card images from Wikipedia…`);

let ok = 0;
const failed = [];
await runPool(todo, 4, async (card) => {
  try {
    const info = await fetchOriginal(card);
    manifest[card.id] = { ...manifest[card.id], ...info, status: manifest[card.id]?.status ?? 'pending' };
    if (info.nonFree) failed.push(`${card.id}: image is not freely licensed; upload a different one on the review page`);
    ok++;
    console.log(`  ✓ ${card.id}  (${info.license})`);
  } catch (e) {
    const why = e.cause?.code ? `${e.message} (${e.cause.code})` : e.message;
    failed.push(`${card.id}: ${why}`);
    console.log(`  ✗ ${card.id}  ${why}`);
  }
});
writeManifest(manifest);
console.log(`\nDone: ${ok} downloaded.`);
if (failed.length) console.log(`Needs attention:\n  ${failed.join('\n  ')}`);
console.log('\nNext: npm run images:clean');
