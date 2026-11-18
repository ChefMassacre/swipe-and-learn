import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CardState, Grade, review, nextStreak, dayKey } from './srs';

// All user data lives on the device for now. When accounts land (Google
// sign-in), this same shape syncs to the backend. See docs/PRODUCT_SPEC.md.

export type Profile = {
  onboarded: boolean;
  goal?: string;
  level?: string;
  dailyMinutes?: number;
  interests: string[]; // topic ids
};

export type SessionRecord = {
  at: number;
  topicId: string; // or 'daily'
  knew: number;
  forgot: number;
  skipped: number;
  xp: number;
};

export type AppState = {
  profile: Profile;
  cards: Record<string, CardState>;
  xp: number;
  streak: number;
  lastPlayedDay: string | null;
  lastTopicId: string | null;
  history: SessionRecord[];
  plus: boolean; // paid tier; toggled by hand until purchases are wired up
  topicRequests: string[];
};

const DEFAULT: AppState = {
  profile: { onboarded: false, interests: [] },
  cards: {},
  xp: 0,
  streak: 0,
  lastPlayedDay: null,
  lastTopicId: null,
  history: [],
  plus: false,
  topicRequests: [],
};

const KEY = 'app-state:v1';

export const XP = { knew: 10, forgot: 4, skip: 0, typedBonus: 5 };

type Ctx = {
  state: AppState;
  ready: boolean;
  setProfile: (p: Partial<Profile>) => void;
  grade: (cardId: string, g: Grade) => void;
  finishSession: (r: Omit<SessionRecord, 'at'>) => void;
  setPlus: (on: boolean) => void;
  requestTopic: (name: string) => void;
  reset: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState({ ...DEFAULT, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const setProfile = useCallback(
    (p: Partial<Profile>) => setState((s) => ({ ...s, profile: { ...s.profile, ...p } })),
    [],
  );

  const grade = useCallback((cardId: string, g: Grade) => {
    setState((s) => ({ ...s, cards: { ...s.cards, [cardId]: review(s.cards[cardId], g, Date.now()) } }));
  }, []);

  const finishSession = useCallback((r: Omit<SessionRecord, 'at'>) => {
    const now = Date.now();
    setState((s) => ({
      ...s,
      xp: s.xp + r.xp,
      streak: nextStreak(s.streak, s.lastPlayedDay, now),
      lastPlayedDay: dayKey(now),
      lastTopicId: r.topicId === 'daily' ? s.lastTopicId : r.topicId,
      history: [{ ...r, at: now }, ...s.history].slice(0, 200),
    }));
  }, []);

  const setPlus = useCallback((on: boolean) => setState((s) => ({ ...s, plus: on })), []);
  const requestTopic = useCallback(
    (name: string) => setState((s) => ({ ...s, topicRequests: [...s.topicRequests, name] })),
    [],
  );
  const reset = useCallback(() => setState(DEFAULT), []);

  const value = useMemo(
    () => ({ state, ready, setProfile, grade, finishSession, setPlus, requestTopic, reset }),
    [state, ready, setProfile, grade, finishSession, setPlus, requestTopic, reset],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
