import 'react-native-url-polyfill/auto';
import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';

// Live link between the party-mode phone and a host's phone, using Supabase
// Realtime "broadcast" channels (no database tables needed).
// Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env
// (see docs/PARTY_HOST.md). Without them, party mode works without a host.

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
// Testing aid: EXPO_PUBLIC_PARTY_LOCAL=1 links browser tabs on one computer (web only), no server needed.
const localOnly = process.env.EXPO_PUBLIC_PARTY_LOCAL === '1' && typeof BroadcastChannel !== 'undefined';
export const hostSyncAvailable = (!!url && !!anonKey) || localOnly;

let client: SupabaseClient | null = null;
function getClient() {
  if (!hostSyncAvailable) return null;
  client ??= createClient(url!, anonKey!, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export type Side = 'a' | 'b';

/** What the game phone shares with the host. */
export type PartyState = {
  status: 'lobby' | 'ready' | 'running' | 'paused' | 'over';
  names: Record<Side, string>;
  time: Record<Side, number>;
  score: Record<Side, number>;
  turn: Side;
  pos: number;
  cardId: string | null;
  answer: string;
  passing: boolean;
  winner: Side | null;
};

/** What the host sends back. `pos` makes sure a tap only counts for the card the host was looking at. */
export type JudgeMessage = { action: 'correct' | 'wrong'; pos: number };

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O
export const newRoomCode = () => Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);

const HEARTBEAT_MS = 2000;
const CONNECTED_WINDOW_MS = 6000;

type ChannelHandlers = { [event: string]: (payload: any) => void };

function useChannel(code: string | null, handlers: ChannelHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [joined, setJoined] = useState(false);
  const events = Object.keys(handlers).sort().join(',');

  useEffect(() => {
    if (!code) return;
    if (localOnly) {
      const bc = new BroadcastChannel(`party-${code}`);
      bc.onmessage = (e) => handlersRef.current[e.data.event]?.(e.data.payload);
      channelRef.current = { send: async ({ event, payload }: any) => bc.postMessage({ event, payload }) } as any;
      setJoined(true);
      return () => {
        setJoined(false);
        channelRef.current = null;
        bc.close();
      };
    }
    const c = getClient();
    if (!c) return;
    const ch = c.channel(`party-${code}`, { config: { broadcast: { self: false } } });
    for (const ev of events.split(',')) {
      ch.on('broadcast', { event: ev }, ({ payload }) => handlersRef.current[ev]?.(payload));
    }
    ch.subscribe((status) => setJoined(status === 'SUBSCRIBED'));
    channelRef.current = ch;
    return () => {
      setJoined(false);
      channelRef.current = null;
      c.removeChannel(ch);
    };
  }, [code, events]);

  const send = (event: string, payload: unknown) => {
    channelRef.current?.send({ type: 'broadcast', event, payload })?.catch?.(() => {});
  };
  return { joined, send };
}

/** Used by the game phone: shares state with the host and receives the host's calls. */
export function useGameRoom(code: string | null, state: PartyState, onJudge: (m: JudgeMessage) => void) {
  const [lastHostSeen, setLastHostSeen] = useState(0);
  const [, force] = useState(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const { joined, send } = useChannel(code, {
    hello: () => {
      setLastHostSeen(Date.now());
      send('state', stateRef.current);
    },
    judge: (m: JudgeMessage) => {
      setLastHostSeen(Date.now());
      onJudge(m);
    },
  });

  // Push every change right away, plus a regular refresh so the host's clocks keep moving.
  const key = JSON.stringify({ ...state, time: undefined });
  useEffect(() => {
    if (joined) send('state', stateRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined, key]);
  useEffect(() => {
    if (!joined) return;
    const iv = setInterval(() => {
      send('state', stateRef.current);
      force((n) => n + 1); // re-check host connection
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined]);

  return { linked: joined, hostConnected: joined && Date.now() - lastHostSeen < CONNECTED_WINDOW_MS };
}

/** Used by the host's phone: receives the game state and sends Correct / Wrong. */
export function useHostRoom(code: string | null) {
  const [state, setState] = useState<PartyState | null>(null);
  const [lastSeen, setLastSeen] = useState(0);
  const [, force] = useState(0);
  const { joined, send } = useChannel(code, {
    state: (s: PartyState) => {
      setState(s);
      setLastSeen(Date.now());
    },
  });

  useEffect(() => {
    if (!joined) return;
    send('hello', {});
    const iv = setInterval(() => {
      send('hello', {});
      force((n) => n + 1);
    }, HEARTBEAT_MS);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined]);

  return {
    joined,
    state,
    gameConnected: joined && Date.now() - lastSeen < CONNECTED_WINDOW_MS,
    judge: (action: JudgeMessage['action']) => state && send('judge', { action, pos: state.pos } satisfies JudgeMessage),
  };
}
