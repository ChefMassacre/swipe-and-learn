import { ImageSource } from 'expo-image';
import { CARD_IMAGES } from '../data/cardImages';
import { Card } from '../data/topics';
import { useWiki } from './wiki';

export type CardPicture = {
  /** Undefined while loading, or when there is no picture. */
  source?: ImageSource | number;
  /** True once we know whether there is a picture. */
  ready: boolean;
  /** Not yet reviewed: may show the answer's name. Only happens in development builds. */
  unreviewed: boolean;
  credit?: string;
};

/** The approved, bundled picture for a card; in development, falls back to the live Wikipedia image. */
export function useCardPicture(card: Card): CardPicture {
  const approved = CARD_IMAGES[card.id];
  const wiki = useWiki(approved ? undefined : card.wiki);
  if (approved) {
    return { source: approved.source, ready: true, unreviewed: false, credit: `${approved.credit} · ${approved.license}${approved.edited ? ' · edited' : ''}` };
  }
  return { source: wiki?.image ? { uri: wiki.image } : undefined, ready: !!wiki, unreviewed: true };
}
