import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Loads a card's picture and summary from Wikipedia's public REST API, and
// caches it on the device so each article is fetched once.
// Docs: https://en.wikipedia.org/api/rest_v1/#/Page%20content/get_page_summary__title_

export type WikiSummary = { image?: string; extract?: string; url: string };

const CACHE_PREFIX = 'wiki:v1:';
const memory = new Map<string, WikiSummary>();
const inflight = new Map<string, Promise<WikiSummary>>();

export function wikiUrl(title: string) {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

export async function fetchWiki(title: string): Promise<WikiSummary> {
  const hit = memory.get(title);
  if (hit) return hit;
  const pending = inflight.get(title);
  if (pending) return pending;

  const p = (async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_PREFIX + title);
      if (cached) return JSON.parse(cached) as WikiSummary;
    } catch {}
    const fallback: WikiSummary = { url: wikiUrl(title) };
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`,
        { headers: { Accept: 'application/json', 'Api-User-Agent': 'SwipeAndLearn/0.1' } },
      );
      if (!res.ok) return fallback;
      const j = await res.json();
      const summary: WikiSummary = {
        image: j.originalimage?.source ?? j.thumbnail?.source,
        extract: j.extract,
        url: j.content_urls?.mobile?.page ?? fallback.url,
      };
      AsyncStorage.setItem(CACHE_PREFIX + title, JSON.stringify(summary)).catch(() => {});
      return summary;
    } catch {
      return fallback;
    }
  })();

  inflight.set(title, p);
  const result = await p;
  inflight.delete(title);
  memory.set(title, result);
  return result;
}

export function useWiki(title: string | undefined) {
  const [data, setData] = useState<WikiSummary | undefined>(title ? memory.get(title) : undefined);
  useEffect(() => {
    if (!title) return;
    let alive = true;
    setData(memory.get(title));
    fetchWiki(title).then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, [title]);
  return data;
}

/** Warm the cache for the next few cards so images appear instantly. */
export function prefetchWiki(titles: string[]) {
  titles.forEach((t) => fetchWiki(t));
}
