# Swipe&Learn — Product Spec (v1)

## One line
Swipe through picture cards to learn and remember things about the world, with spaced repetition that brings each card back right before you'd forget it.

## Who it's for
People who want to be better at trivia, know more about the world, or grow their vocabulary, in short sessions that feel like a game.

## Platforms and release order
1. iOS App Store (first)
2. Google Play

Built with Expo / React Native. There is no Mac in the workflow, so iOS builds and submissions go through EAS Build and EAS Submit. Needs an Apple Developer account ($99/yr).

## Core loop
1. Pick a topic (or start the **Daily review**).
2. A card shows a picture and a prompt ("Which console is this?").
3. The user answers in their head, then **taps to flip**.
4. After the flip they swipe:
   - **Right**: I knew it.
   - **Left**: I didn't know it. A short summary appears, with a "Read more on Wikipedia" link.
   - **Up**: Not for me. The card never comes back.
   - Swiping is locked until the card is flipped, so nobody can claim to know answers they never saw (that would break the memory system). Buttons mirror the swipes.
5. After 10 cards: results (score, XP, streak).
6. Spaced repetition decides what comes back and when.

**Type it mode** (harder): the user types the answer, which is matched loosely (ignores case, accents, "the", and small typos). +5 XP per correct card.

## Spaced repetition
Simplified SM-2 (Anki's algorithm), in `src/lib/srs.ts`:
- Known on first sight: back in 3 days. Each later success multiplies the interval by the card's ease (starts at 2.5).
- Forgotten: back in 10 minutes, ease drops by 0.2 (minimum 1.3).
- "Not for me": hidden for good.
- Mastered: interval of 21+ days.
- A session is cards that are due (most overdue first), then new cards to fill it.

## Onboarding (under 60 seconds to the first card)
1. What brings you here? (trivia / the world / vocabulary / fun)
2. How much time a day? (3 / 5 / 10 / 15 min)
3. Pick topics (at least one), plus an optional "request a topic" box.
4. One "how to play" screen showing the three swipes, then straight into a first round.

"How did you hear about us" is asked later (after a few sessions), not at sign-up.

## Tabs
- **Home**: streak, level/XP, Daily review, Continue last topic, recommended topics ("For you"), Party mode.
- **Explore**: every topic grouped by category, interests first. Request a topic. Later: a connected, Kinnu-style map.
- **Progress**: streak, level, cards seen and mastered, cards due, mastery per topic, recent sessions.
- **Compete**: Party mode. Later: weekly leagues and friend challenges (need accounts).
- **Profile**: account, Plus, achievements, interests, settings.

## Party mode (local multiplayer)
Inspired by head-to-head game shows, without boards or territories.
- Two sides (players or teams) on one phone, each with its own clock (30/45/60/90 s).
- The active side shouts answers at the picture. A neutral **host on a second phone** (joined by a 4-letter room code) sees the answer and taps Correct or Wrong. The clock keeps running through wrong guesses and switches sides only on Correct, so nobody can cheat. Sync: Supabase Realtime (see docs/PARTY_HOST.md).
- No host: players tap their own side; the other side has 3 seconds to Undo. Also used automatically if the host drops out.
- **Pass**: the answer shows for 3 seconds while your clock keeps running, then a new card.
- Run out of time and the other side wins the round. Wins are tallied across rounds; the starting side alternates.
- Layouts: "Same side / TV" (everything upright, for screen mirroring) or "Face to face" (top half rotated for a phone lying between two players).
- TV: v1 uses the phone's built-in screen mirroring (AirPlay / Cast). Later: a proper second-screen view via Google Cast so the TV shows the picture and scores while the phone shows controls.

## Content
- Each card: answer, accepted aliases, Wikipedia article title, our own 1–2 sentence blurb.
- Images: each card's Wikipedia photo is downloaded once, an AI image editor removes names/logos/model numbers that give the answer away, and Isaac approves each one on a local review page (docs/IMAGES.md). Approved images ship inside the app; release builds only include approved cards. Credits and licenses are kept and shown.
- The longer summary on the Learn screen still comes from Wikipedia at runtime, cached on the device.
- Isaac edits content in `src/data/topics.ts` (see `docs/CONTENT.md`). Later: AI-drafted topics (an LLM proposes 30 items + blurbs from Wikipedia, a human approves), served from a backend so new topics ship without an app update.
- **Risk:** celebrity and brand photos. Wikipedia lead images are usually fine, but brand logos are often non-free "fair use" on Wikipedia and can't be reused. Check each card's image license before launch; prefer product photos over logos.

## Accounts
- v1 MVP: guest, progress saved on the device.
- Next: quick sign-up with **Sign in with Google** and **Sign in with Apple** (Apple requires Apple sign-in whenever Google sign-in is offered on iOS). Progress syncs to a backend. Suggested: Supabase (auth + Postgres) or Firebase.

## Monetization (freemium)
- **Free**: a few starter topics (Game Consoles, Philosophers, Construction Equipment), daily review, party mode with free topics, banner/interstitial ads between sessions (never mid-session).
- **Plus**: every topic, no ads, type-it everywhere. Monthly, yearly (with free trial), or lifetime one-time purchase.
- Implementation: RevenueCat for subscriptions and the one-time unlock; Google AdMob via `react-native-google-mobile-ads`. Both need a development build (not Expo Go).
- The MVP has a paywall screen and a developer switch in Profile to test Plus.

## Gamification
XP (10 per known card, 4 per learned card, +5 in type-it), levels every 200 XP, daily streaks, achievements. Later: streak freeze, weekly leagues, push reminders at the user's chosen time.

## What's built in the MVP
- Onboarding, topic picker, all five tabs, topic detail with mode choice
- Flip-and-swipe game, type-it mode, learn panel, results
- Spaced repetition with unit tests, streaks, XP, levels, achievements
- Party mode (1v1 or teams, clocks, pass, rounds, TV-friendly layout)
- 5 sample topics (50 cards) + 5 "coming soon" topics
- Freemium gating with a placeholder paywall

## Next steps (suggested order)
1. Try it on a phone with Expo Go and adjust the feel.
2. Content pipeline: baked images + attribution, 10–15 launch topics.
3. Accounts (Google + Apple sign-in) and cloud sync.
4. RevenueCat + AdMob, then a development build via EAS.
5. App Store assets, privacy policy, TestFlight beta, submit.
6. Then Google Play.
