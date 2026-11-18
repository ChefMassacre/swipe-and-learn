# Swipe&Learn

Swipe through picture cards to learn about the world. Flip, swipe right if you knew it, left to learn it, up to skip. Spaced repetition brings cards back before you forget them. Includes a two-player party mode.

- Product spec: [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)
- Editing topics and cards: [docs/CONTENT.md](docs/CONTENT.md)

## Run it on your phone
1. Install **Expo Go** on your phone.
2. On a computer with Node.js 20+:
   ```bash
   npm install
   npx expo start
   ```
3. Scan the QR code with the camera (iPhone) or Expo Go (Android).

You can also run `npx expo start --web` to try it in a browser.

## Checks
```bash
npm run typecheck   # TypeScript
npm test            # spaced repetition unit tests
```

## Build for the App Store (no Mac needed)
```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios
```
EAS will ask for your Apple Developer account and handle certificates.

## Layout
- `src/app/` screens (Expo Router: each file is a route)
- `src/components/` shared UI, including the swipe card
- `src/lib/` spaced repetition, storage, Wikipedia loader
- `src/data/topics.ts` all topics and cards
