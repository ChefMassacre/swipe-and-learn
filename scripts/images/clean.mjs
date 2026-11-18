// Step 2: ask an AI image model to remove names, logos and other giveaway text.
// Needs OPENAI_API_KEY in a .env file. Costs a few cents per image.
//   npm run images:clean                 (only cards not cleaned yet)
//   npm run images:clean -- --only=consoles
//   npm run images:clean -- --force      (clean again)
import { loadCards, filterCards, hasFlag, readManifest, findFile, cleanImage, runPool } from './lib.mjs';

const cards = filterCards(await loadCards());
const manifest = readManifest();
const force = hasFlag('--force');
// Topics marked keepOriginal (like flags) must stay exact, so they skip the AI.
const todo = cards.filter(
  (c) => !c.keepOriginal && findFile('original', c.id) && manifest[c.id]?.status !== 'approved' && (force || !findFile('cleaned', c.id)),
);
console.log(`Cleaning ${todo.length} images (already approved cards are skipped)…`);

const failed = [];
await runPool(todo, 2, async (card) => {
  try {
    await cleanImage(card, manifest[card.id]?.note);
    console.log(`  ✓ ${card.id}`);
  } catch (e) {
    failed.push(`${card.id}: ${e.message}`);
    console.log(`  ✗ ${card.id}  ${e.message}`);
    // Account-wide problems: stop instead of repeating the same error for every card.
    if (/OPENAI_API_KEY|not valid|no image-editing model|verif|billing|quota|does not exist|Could not list/i.test(e.message)) {
      console.log('\nStopping: fix the problem above, then run npm run images:clean again.');
      process.exit(1);
    }
  }
});
if (failed.length) console.log(`\nFailed:\n  ${failed.join('\n  ')}`);
console.log('\nNext: npm run images:review');
