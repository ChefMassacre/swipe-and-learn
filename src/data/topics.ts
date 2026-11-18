// The topics the app plays with. Cards come from topicsData.ts, filtered by
// image review (see docs/IMAGES.md):
//  - Release builds only include cards whose image was approved.
//  - Development builds also show unreviewed cards (with the live Wikipedia
//    image) so you can try new content before reviewing it.
//  - Rejected cards never appear.
import { CATEGORIES, RAW_TOPICS, type Card, type Category, type Topic } from './topicsData';
import { CARD_IMAGES, REJECTED_CARDS } from './cardImages';

export { CATEGORIES };
export type { Card, Category, Topic };

declare const __DEV__: boolean;
export const SHOW_UNREVIEWED = typeof __DEV__ !== 'undefined' && __DEV__;

const rejected = new Set(REJECTED_CARDS);
export const hasApprovedImage = (cardId: string) => cardId in CARD_IMAGES;
const isLive = (c: Card) => !rejected.has(c.id) && (hasApprovedImage(c.id) || SHOW_UNREVIEWED);

export const TOPICS: Topic[] = RAW_TOPICS.map((t) => ({ ...t, cards: t.cards.filter(isLive) }));

export const topicById = (id: string) => TOPICS.find((t) => t.id === id);
export const playableTopics = () => TOPICS.filter((t) => t.cards.length > 0);
export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id)!;

const cardIndex = new Map<string, { card: Card; topic: Topic }>();
for (const t of TOPICS) for (const card of t.cards) cardIndex.set(card.id, { card, topic: t });
export const cardById = (id: string) => cardIndex.get(id);
