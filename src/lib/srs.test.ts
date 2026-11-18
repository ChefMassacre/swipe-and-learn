import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  review, buildSession, isDue, isMastered, answerMatches, nextStreak, currentStreak, dayKey,
  DAY, MINUTE, RELEARN_DELAY, MIN_EASE, type CardState,
} from './srs.ts';

const NOW = new Date(2026, 10, 18, 12).getTime();

test('a card known on first sight comes back in 3 days', () => {
  const s = review(undefined, 'knew', NOW);
  assert.equal(s.interval, 3);
  assert.equal(s.due, NOW + 3 * DAY);
});

test('intervals grow with each successful review', () => {
  let s = review(undefined, 'knew', NOW);
  s = review(s, 'knew', s.due);
  assert.ok(s.interval > 3);
  const prev = s.interval;
  s = review(s, 'knew', s.due);
  assert.ok(s.interval > prev);
});

test('forgetting resets the interval, lowers ease, and brings it back soon', () => {
  let s = review(undefined, 'knew', NOW);
  s = review(s, 'knew', s.due);
  const f = review(s, 'forgot', NOW);
  assert.equal(f.interval, 0);
  assert.equal(f.due, NOW + RELEARN_DELAY);
  assert.ok(f.ease < s.ease);
  assert.equal(f.lapses, 1);
  const again = review(f, 'knew', f.due);
  assert.equal(again.interval, 1);
});

test('ease never drops below the minimum', () => {
  let s: CardState | undefined;
  for (let i = 0; i < 20; i++) s = review(s, 'forgot', NOW);
  assert.equal(s!.ease, MIN_EASE);
});

test('ignored cards are never due or offered as new', () => {
  const s = review(undefined, 'ignore', NOW);
  assert.equal(isDue(s, NOW + 100 * DAY), false);
  const session = buildSession(['a', 'b'], { a: s }, NOW, 10);
  assert.deepEqual(session, ['b']);
});

test('sessions put due cards ahead of new ones and respect the size', () => {
  const dueCard = review(undefined, 'forgot', NOW - 20 * MINUTE);
  const notDue = review(undefined, 'knew', NOW);
  const states = { due1: dueCard, later: notDue };
  const ids = ['due1', 'later', 'n1', 'n2', 'n3'];
  const session = buildSession(ids, states, NOW, 2);
  assert.equal(session.length, 2);
  assert.ok(session.includes('due1'));
  assert.ok(!session.includes('later'));
});

test('maxNew caps how many new cards join a session', () => {
  const session = buildSession(['n1', 'n2', 'n3', 'n4'], {}, NOW, 10, 2);
  assert.equal(session.length, 2);
});

test('mastered after a long interval', () => {
  let s = review(undefined, 'knew', NOW);
  for (let i = 0; i < 4; i++) s = review(s, 'knew', s.due);
  assert.ok(isMastered(s));
});

test('typed answers are forgiving', () => {
  assert.ok(answerMatches('playstation 2', ['PlayStation 2']));
  assert.ok(answerMatches('Socrates', ['Socrates']));
  assert.ok(answerMatches('socretes', ['Socrates']));
  assert.ok(answerMatches('nietzche', ['Friedrich Nietzsche', 'Nietzsche']));
  assert.ok(answerMatches('the excavator', ['Excavator']));
  assert.ok(!answerMatches('Plato', ['Socrates']));
  assert.ok(!answerMatches('', ['Socrates']));
  assert.ok(!answerMatches('NES', ['Wii']));
});

test('streaks continue on consecutive days and reset after a gap', () => {
  const yesterday = dayKey(NOW - DAY);
  assert.equal(nextStreak(4, yesterday, NOW), 5);
  assert.equal(nextStreak(4, dayKey(NOW), NOW), 4);
  assert.equal(nextStreak(4, dayKey(NOW - 3 * DAY), NOW), 1);
  assert.equal(nextStreak(0, null, NOW), 1);
  assert.equal(currentStreak(4, yesterday, NOW), 4);
  assert.equal(currentStreak(4, dayKey(NOW - 2 * DAY), NOW), 0);
});
