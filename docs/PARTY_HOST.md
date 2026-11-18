# Party mode host phone

So nobody can cheat, a neutral host judges answers from their own phone:

1. The game phone (or the TV it's mirrored to) shows the picture and both clocks, plus a 4-letter room code.
2. The host opens Swipe&Learn › **Home** › **Be the host** (at the bottom) and types the code.
3. The host sees the answer (and accepted alternatives) with big **Correct** and **Wrong** buttons. The active player's clock keeps running until the host taps Correct, then it switches sides. Wrong just flashes "Nope" on the game screen.
4. Players can still Pass on the game phone (3-second penalty).

No host? Tap **Play without a host** in the lobby (or choose it in setup). Players then tap their own side, and the other side has 3 seconds to Undo. If the host's phone drops out mid-game, the game switches to that automatically.

## Setup (one time, free)
The two phones talk through Supabase Realtime. It's free for this, and the same Supabase project can later hold accounts and Google sign-in.

1. Sign up at supabase.com and create a new project (any name, any region near you).
2. Go to **Project Settings › API Keys** (or **API**). Copy the **Project URL** and the **anon / publishable** key.
3. In the project folder, copy `.env.example` to `.env` (if you haven't) and fill in:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```
4. Restart `npx expo start`. "A host on another phone" is now available in party setup.
5. For EAS builds, also add both values on expo.dev under your project's **Environment variables**, because `.env` isn't uploaded.

The anon key is safe to put in the app; it's designed to be public. If hosting doesn't connect, check **Realtime › Settings** in Supabase and make sure public channel access is allowed.

## Testing without Supabase
`EXPO_PUBLIC_PARTY_LOCAL=1 npx expo start --web`, then open the game in one browser tab and the host in another.
