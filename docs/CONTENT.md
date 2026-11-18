# Editing content

All topics live in `src/data/topicsData.ts`. After adding cards, get their pictures with the steps in [IMAGES.md](IMAGES.md).

## Add a card to a topic
Inside a topic's `cards: [...]`, add a line:

```ts
c('consoles-ps5', 'PlayStation 5', 'PlayStation 5', "Sony's 2020 console with a DualSense controller.", { aliases: ['PS5'] }),
```

The parts, in order:
1. **id**: unique, never change it once released (progress is saved against it).
2. **answer**: what shows on the back of the card.
3. **Wikipedia title**: the article name exactly as in its URL (`en.wikipedia.org/wiki/PlayStation_5` → `PlayStation 5`). The picture starts from that article's main image (see IMAGES.md).
4. **blurb**: one or two sentences shown when someone didn't know it.
5. **aliases** (optional): other answers accepted in "Type it" mode.
6. **fact** (optional): a "Did you know?" shown after the reveal, e.g. `{ fact: "..." }`. Only add one if it's genuinely surprising and you're sure it's true. Skip it rather than add a dull one.

## Add a topic
Copy a whole topic block, give it a new `id`, `title`, `emoji`, `categoryId` (one of the `CATEGORIES`), `prompt`, `description`, and `free: true/false`. Topics need at least 4 cards for Easy mode. Add `keepOriginal: true` for pictures the AI must never edit (like flags).

## Drafting with AI
Ask ChatGPT or Claude: "List 20 well-known [construction machines] that each have a Wikipedia article with a clear photo. For each, give the exact Wikipedia article title, a 1–2 sentence fun fact, and common alternative names, formatted like this: c('id', 'Answer', 'Wikipedia title', 'blurb', { aliases: [...] })". Then check each article has a good lead photo before adding it.
