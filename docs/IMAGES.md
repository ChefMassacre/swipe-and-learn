# Card images: remove the giveaways, then approve

Wikipedia photos often show the answer (an Xbox with "XBOX" printed on it). Each picture goes through three steps once, on your computer. Only pictures you approve ship in the app.

| Step | Command | What it does |
|---|---|---|
| 1. Fetch | `npm run images:fetch` | Downloads each card's photo from its Wikipedia article, with the author and license. Free, no key needed. |
| 2. Clean | `npm run images:clean` | Sends each photo to OpenAI's image editor, which removes names, logos, model numbers and other text and changes nothing else. Needs an OpenAI API key. |
| 3. Review | `npm run images:review` | Opens a page in your browser. For each card, pick the AI-cleaned version, the original, or upload your own picture, or hide the card. |

Run them from the project folder (where `package.json` is), in that order. Steps 1 and 2 only do cards that aren't done yet, so you can re-run them after adding cards. Use `-- --only=consoles` (a topic id) or `-- --only=consoles-xbox` (a card id) to limit them, and `-- --force` to redo.

## One-time setup for step 2
1. Make an OpenAI account at platform.openai.com, add a payment method, and create an API key under **API keys**.
2. In the project folder, copy `.env.example` to a new file called `.env` and paste the key after `OPENAI_API_KEY=`.
3. Cost: OpenAI charges per edited image, roughly a few cents to about 20 cents each depending on the model and quality. 50 cards is a few dollars. Check current prices on OpenAI's pricing page.

You can skip step 2 entirely and just pick "Original" or upload your own pictures on the review page.

## Reviewing
- Look for any leftover name, logo or model number, and for anything the AI warped (faces, shapes, extra fingers). For people, the original is often the better choice.
- Not quite right? Type extra instructions ("also remove the sticker on the left") and click **Clean again**.
- Your choices save as you click. They copy the picture into `assets/cards/` and update `src/data/cardImages.ts`.
- When you're done, commit those files (or send them to Claude) so they ship in the next build.

## How the app uses them
- **Release builds** (App Store / Play Store) only include cards with an approved picture.
- **Development** (`npx expo start`) also shows not-yet-reviewed cards with the live Wikipedia picture and an "Unreviewed image" tag, so you can try new cards first.
- Hidden cards never appear.
- The picture credit shows on the "Learn it" screen. Edited Wikipedia photos keep their original license (often CC BY-SA), which is why the credit is kept.

## Files
- `scripts/images/` the three scripts
- `content/images/manifest.json` your decisions and each photo's credit/license (commit this)
- `content/images/work/` downloaded and edited versions (not committed)
- `assets/cards/` approved pictures that ship with the app (commit this)
