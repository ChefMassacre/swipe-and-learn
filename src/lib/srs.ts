// Spaced repetition scheduling (a simplified SM-2, like Anki).
// Pure functions with no imports so they can be unit tested with plain Node.

export type Grade = 'knew' | 'forgot' | 'ignore';

export type CardState = {
  /** Days until the next review after a successful recall. 0 = still learning. */
  interval: number;
  /** Growth multiplier for the interval. Drops when the user forgets. */
  ease: number;
  /** Timestamp (ms) when the card is next due. */
  due: number;
  reps: number;
  lapses: number;
  ignored: boolean;
  lastSeen: number;
};

export const MINUTE = 60 * 1000;
export const DAY = 24 * 60 * MINUTE;
export const MIN_EASE = 1.3;
export const START_EASE = 2.5;
/** A forgotten card comes back after this long (so it can reappear later the same day). */
export const RELEARN_DELAY = 10 * MINUTE;
/** A card counts as "mastered" once its interval reaches this many days. */
export const MASTERED_DAYS = 21;

export function newCardState(): CardState {
  return { interval: 0, ease: START_EASE, due: 0, reps: 0, lapses: 0, ignored: false, lastSeen: 0 };
}

export function review(prev: CardState | undefined, grade: Grade, now: number): CardState {
  const s = prev ?? newCardState();
  if (grade === 'ignore') {
    return { ...s, ignored: true, lastSeen: now };
  }
  if (grade === 'forgot') {
    return {
      ...s,
      interval: 0,
      ease: Math.max(MIN_EASE, s.ease - 0.2),
      due: now + RELEARN_DELAY,
      lapses: s.lapses + 1,
      reps: s.reps + 1,
      ignored: false,
      lastSeen: now,
    };
  }
  // knew it
  let interval: number;
  if (s.interval === 0) interval = s.reps === 0 ? 3 : 1; // known on first sight -> 3 days; relearned -> 1 day
  else if (s.interval < 3) interval = 3;
  else interval = Math.round(s.interval * s.ease);
  return {
    ...s,
    interval,
    ease: Math.min(3.0, s.ease + 0.05),
    due: now + interval * DAY,
    reps: s.reps + 1,
    ignored: false,
    lastSeen: now,
  };
}

export function isNew(s: CardState | undefined): boolean {
  return !s || s.reps === 0;
}

export function isDue(s: CardState | undefined, now: number): boolean {
  return !!s && !s.ignored && s.reps > 0 && s.due <= now;
}

export function isMastered(s: CardState | undefined): boolean {
  return !!s && !s.ignored && s.interval >= MASTERED_DAYS;
}

/**
 * Build a study session: cards that are due come first (most overdue first),
 * then new cards fill the rest. Ignored cards never appear.
 */
export function buildSession(
  cardIds: string[],
  states: Record<string, CardState | undefined>,
  now: number,
  size: number,
  maxNew: number = size,
): string[] {
  const due = cardIds
    .filter((id) => isDue(states[id], now))
    .sort((a, b) => states[a]!.due - states[b]!.due);
  const fresh = cardIds.filter((id) => isNew(states[id]) && !states[id]?.ignored);
  const session = due.slice(0, size);
  const room = Math.min(size - session.length, maxNew);
  if (room > 0) session.push(...shuffle(fresh).slice(0, room));
  return shuffle(session);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Loose answer matching for "type it" mode: ignores case, accents, punctuation, "the", and small typos. */
export function answerMatches(input: string, answers: string[]): boolean {
  const n = normalize(input);
  if (!n) return false;
  return answers.some((a) => {
    const t = normalize(a);
    if (n === t) return true;
    const allowed = t.length <= 4 ? 0 : t.length <= 8 ? 1 : 2;
    return levenshtein(n, t) <= allowed;
  });
}

export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\bthe\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** Local calendar day key, used for streaks. */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** New streak after playing at `now`, given the last day played. */
export function nextStreak(streak: number, lastDay: string | null, now: number): number {
  const today = dayKey(now);
  if (lastDay === today) return Math.max(streak, 1);
  if (lastDay === dayKey(now - DAY)) return streak + 1;
  return 1;
}

/** Streak to display: it lapses if the user missed yesterday. */
export function currentStreak(streak: number, lastDay: string | null, now: number): number {
  if (!lastDay) return 0;
  if (lastDay === dayKey(now) || lastDay === dayKey(now - DAY)) return streak;
  return 0;
}

export const XP_PER_LEVEL = 200;
export function levelFor(xp: number): { level: number; into: number; needed: number } {
  return { level: Math.floor(xp / XP_PER_LEVEL) + 1, into: xp % XP_PER_LEVEL, needed: XP_PER_LEVEL };
}
