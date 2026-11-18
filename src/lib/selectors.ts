import { TOPICS, Topic, playableTopics } from '../data/topics';
import { AppState } from './store';
import { isDue, isMastered, isNew } from './srs';

export type TopicProgress = {
  total: number;
  seen: number;
  mastered: number;
  due: number;
  fresh: number;
  /** 0..1 */
  mastery: number;
};

export function topicProgress(topic: Topic, state: AppState, now = Date.now()): TopicProgress {
  let seen = 0, mastered = 0, due = 0, fresh = 0, score = 0;
  for (const c of topic.cards) {
    const s = state.cards[c.id];
    if (s?.ignored) continue;
    if (isNew(s)) fresh++;
    else seen++;
    if (isDue(s, now)) due++;
    if (isMastered(s)) mastered++;
    // partial credit: each successful interval step counts toward mastery
    if (s && s.interval > 0) score += Math.min(1, s.interval / 21);
  }
  const total = topic.cards.filter((c) => !state.cards[c.id]?.ignored).length;
  return { total, seen, mastered, due, fresh, mastery: total ? score / total : 0 };
}

export function canPlay(topic: Topic, state: AppState) {
  return topic.cards.length > 0 && (topic.free || state.plus);
}

/** Card ids that are due across every topic the user can play. */
export function allDueCardIds(state: AppState, now = Date.now()) {
  return playableTopics()
    .filter((t) => canPlay(t, state))
    .flatMap((t) => t.cards.filter((c) => isDue(state.cards[c.id], now)).map((c) => c.id));
}

/** Pool for the Daily review: everything playable, weighted to interests. */
export function dailyPool(state: AppState) {
  const topics = playableTopics().filter((t) => canPlay(t, state));
  const preferred = topics.filter((t) => state.profile.interests.includes(t.id));
  return (preferred.length ? preferred : topics).flatMap((t) => t.cards.map((c) => c.id));
}

export function recommendedTopics(state: AppState) {
  const interests = new Set(state.profile.interests);
  return [...TOPICS]
    .filter((t) => t.cards.length > 0)
    .sort((a, b) => Number(interests.has(b.id)) - Number(interests.has(a.id)));
}
