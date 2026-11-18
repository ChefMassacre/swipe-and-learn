import { CATEGORIES, Category, TOPICS, Topic } from '../data/topics';

// Positions for the Explore map. Categories are hubs placed around a circle
// (neighbours are categories with the most links between them); each hub's
// topics fan out away from the centre.

// The world is taller than wide so the whole map fits a portrait phone nicely.
export const WORLD_W = 1400;
export const WORLD_H = 1900;
const CX = WORLD_W / 2;
const CY = WORLD_H / 2;
const HUB_RX = 410;
const HUB_RY = 600;
const TOPIC_RADIUS = 190;
const FAN_STEP = (52 * Math.PI) / 180;

export type MapHub = { cat: Category; x: number; y: number };
export type MapTopic = { topic: Topic; cat: Category; x: number; y: number };
export type MapEdge = { from: { x: number; y: number }; to: { x: number; y: number }; color: string; kind: 'branch' | 'related' };

/** Orders categories so the ones sharing the most related links sit next to each other. */
function orderCategories(): Category[] {
  const links = new Map<string, number>();
  const key = (a: string, b: string) => [a, b].sort().join('|');
  for (const t of TOPICS) for (const r of t.related ?? []) {
    const other = TOPICS.find((x) => x.id === r);
    if (other && other.categoryId !== t.categoryId) links.set(key(t.categoryId, other.categoryId), (links.get(key(t.categoryId, other.categoryId)) ?? 0) + 1);
  }
  const used = CATEGORIES.filter((c) => TOPICS.some((t) => t.categoryId === c.id));
  const order = [used[0]];
  while (order.length < used.length) {
    const last = order[order.length - 1];
    const next = used
      .filter((c) => !order.includes(c))
      .sort((a, b) => (links.get(key(last.id, b.id)) ?? 0) - (links.get(key(last.id, a.id)) ?? 0))[0];
    order.push(next);
  }
  return order;
}

export function buildMap() {
  const cats = orderCategories();
  const hubs: MapHub[] = [];
  const topics: MapTopic[] = [];
  const edges: MapEdge[] = [];

  cats.forEach((cat, i) => {
    const a = -Math.PI / 2 + (i / cats.length) * Math.PI * 2;
    const hub = { cat, x: CX + Math.cos(a) * HUB_RX, y: CY + Math.sin(a) * HUB_RY };
    hubs.push(hub);
    const ts = TOPICS.filter((t) => t.categoryId === cat.id);
    ts.forEach((topic, j) => {
      const ta = a + (j - (ts.length - 1) / 2) * FAN_STEP;
      const r = TOPIC_RADIUS + (ts.length > 2 && j % 2 ? 40 : 0);
      const node = { topic, cat, x: hub.x + Math.cos(ta) * r, y: hub.y + Math.sin(ta) * r };
      topics.push(node);
      edges.push({ from: hub, to: node, color: cat.color, kind: 'branch' });
    });
  });

  // Neighbouring hubs are joined by a faint ring so the map reads as one web.
  hubs.forEach((h, i) => {
    const n = hubs[(i + 1) % hubs.length];
    edges.unshift({ from: h, to: n, color: '#D9D2E4', kind: 'branch' });
  });

  const byId = new Map(topics.map((t) => [t.topic.id, t]));
  const seen = new Set<string>();
  for (const t of topics) for (const r of t.topic.related ?? []) {
    const other = byId.get(r);
    const k = [t.topic.id, r].sort().join('|');
    if (!other || seen.has(k)) continue;
    seen.add(k);
    edges.push({ from: t, to: other, color: t.cat.color, kind: 'related' });
  }

  return { hubs, topics, edges };
}
