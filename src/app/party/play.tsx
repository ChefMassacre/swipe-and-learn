import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { cardById, playableTopics } from '../../data/topics';
import { shuffle } from '../../lib/srs';
import { useStore } from '../../lib/store';
import { canPlay } from '../../lib/selectors';
import { prefetchWiki } from '../../lib/wiki';
import { useCardPicture } from '../../lib/cardImage';
import { hasApprovedImage, Card } from '../../data/topics';
import { colors, radius } from '../../lib/theme';
import { hostSyncAvailable, JudgeMessage, newRoomCode, PartyState, useGameRoom } from '../../lib/partySync';

type Side = 'a' | 'b';
type JudgeMode = 'host' | 'self';
const PASS_PENALTY_MS = 3000;
const TICK = 100;
const SIDE_COLOR: Record<Side, string> = { a: colors.primary, b: colors.gold };
const UNDO_WINDOW_MS = 3000;
type Snapshot = { turn: Side; pos: number; deck: string[]; time: Record<Side, number> };

// Party mode: a two-sided chess clock with picture cards in the middle.
export default function PartyPlay() {
  const params = useLocalSearchParams<{ a: string; b: string; seconds: string; topics: string; flip: string; judge: string }>();
  // 'host': a neutral person on another phone taps Correct / Wrong (recommended).
  // 'self': no host; players tap their own side and the other side can Undo.
  const [useHost, setUseHost] = useState(params.judge === 'host' && hostSyncAvailable);
  const [roomCode] = useState(() => (params.judge === 'host' && hostSyncAvailable ? newRoomCode() : null));
  const { state } = useStore();
  const totalMs = Number(params.seconds || 45) * 1000;
  const faceToFace = params.flip === '1';
  const names: Record<Side, string> = { a: params.a || 'Player 1', b: params.b || 'Player 2' };

  const pool = useMemo(() => {
    const ids = params.topics ? params.topics.split(',') : [];
    return playableTopics()
      .filter((t) => canPlay(t, state) && (ids.length === 0 || ids.includes(t.id)))
      .flatMap((t) => t.cards.map((c) => c.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.topics]);

  const [deck, setDeck] = useState(() => shuffle(pool));
  const [pos, setPos] = useState(0);
  const [time, setTime] = useState<Record<Side, number>>({ a: totalMs, b: totalMs });
  const [turn, setTurn] = useState<Side>('a');
  const [status, setStatus] = useState<'lobby' | 'ready' | 'running' | 'paused' | 'over'>(useHost ? 'lobby' : 'ready');
  const [passing, setPassing] = useState(false);
  const [flash, setFlash] = useState<{ text: string; kind: 'correct' | 'wrong'; undo?: Snapshot } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [score, setScore] = useState<Record<Side, number>>({ a: 0, b: 0 });
  const [winner, setWinner] = useState<Side | null>(null);
  const [starter, setStarter] = useState<Side>('a');
  const lastTick = useRef(Date.now());

  useEffect(() => { prefetchWiki(pool.filter((id) => !hasApprovedImage(id)).map((id) => cardById(id)!.card.wiki)); }, [pool]);

  const card = cardById(deck[pos % deck.length])?.card;

  const shared: PartyState = {
    status, names, time, score, turn, pos, passing, winner,
    cardId: card?.id ?? null,
    answer: card?.answer ?? '',
  };
  const room = useGameRoom(useHost ? roomCode : null, shared, (m: JudgeMessage) => {
    if (m.pos !== pos) return; // the host tapped for a card that's already gone
    if (m.action === 'correct') correct();
    else wrong();
  });
  // If the host drops out mid-game, players fall back to tapping their own side.
  const judgeMode: JudgeMode = useHost && room.hostConnected ? 'host' : 'self';

  // Clock
  useEffect(() => {
    if (status !== 'running') return;
    lastTick.current = Date.now();
    const iv = setInterval(() => {
      const now = Date.now();
      const dt = now - lastTick.current;
      lastTick.current = now;
      setTime((t) => ({ ...t, [turn]: Math.max(0, t[turn] - dt) }));
    }, TICK);
    return () => clearInterval(iv);
  }, [status, turn]);

  // Time out
  useEffect(() => {
    if (status === 'running' && time[turn] <= 0) {
      const w: Side = turn === 'a' ? 'b' : 'a';
      setWinner(w);
      setScore((s) => ({ ...s, [w]: s[w] + 1 }));
      setStatus('over');
      setPassing(false);
      buzz('error');
    }
  }, [time, turn, status]);

  const nextCard = () => {
    const next = pos + 1;
    if (next % deck.length === 0) setDeck(shuffle(pool));
    setPos(next);
  };

  const showFlash = (f: NonNullable<typeof flash>, ms: number) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash(f);
    flashTimer.current = setTimeout(() => setFlash(null), ms);
  };

  // The active side got it right: next card, and the clock switches over.
  // With a host, the host's phone calls this; otherwise the active side taps their own zone.
  const correct = () => {
    if (status !== 'running' || passing || !card) return;
    buzz('success');
    const undo: Snapshot = { turn, pos, deck, time };
    showFlash({ text: `✓ ${card.answer}`, kind: 'correct', undo: judgeMode === 'self' ? undo : undefined }, UNDO_WINDOW_MS);
    nextCard();
    setTurn(turn === 'a' ? 'b' : 'a');
  };

  // The judge heard a wrong answer: nothing changes, the active clock keeps running.
  const wrong = () => {
    if (status !== 'running' || passing) return;
    buzz('error');
    showFlash({ text: '✗ Nope, keep going', kind: 'wrong' }, 1200);
  };

  // Mis-tap or disputed answer: put the turn, card and both clocks back.
  const undo = () => {
    const snap = flash?.undo;
    if (!snap) return;
    setTurn(snap.turn);
    setPos(snap.pos);
    setDeck(snap.deck);
    setTime(snap.time);
    setFlash(null);
    buzz('light');
  };

  const pass = (side: Side) => {
    if (status !== 'running' || side !== turn || passing) return;
    buzz('light');
    setPassing(true);
    setTimeout(() => {
      setPassing(false);
      nextCard();
    }, PASS_PENALTY_MS);
  };

  const rematch = () => {
    const s: Side = starter === 'a' ? 'b' : 'a'; // alternate who starts
    setStarter(s);
    setTurn(s);
    setTime({ a: totalMs, b: totalMs });
    setWinner(null);
    setFlash(null);
    nextCard();
    setStatus('ready');
  };

  if (pool.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.overlayTitle}>No cards available</Text>
        <Pressable onPress={() => router.back()}><Text style={styles.link}>Back</Text></Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <PlayerZone
        side="b" name={names.b} ms={time.b} score={score.b} active={turn === 'b'} running={status === 'running' && !passing}
        rotated={faceToFace} judgeMode={judgeMode}
        onCorrect={correct} onPass={() => pass('b')}
      />

      <View style={styles.middle}>
        {card && <PartyCard card={card} answer={card.answer} emoji={cardById(deck[pos % deck.length])!.topic.emoji} showAnswer={passing} />}
        {flash && (
          <View style={[styles.flash, { backgroundColor: flash.kind === 'correct' ? colors.knew : colors.forgot }]}>
            <Text style={styles.flashText}>{flash.text}</Text>
            {flash.undo && (
              <Pressable onPress={undo} hitSlop={10} style={styles.undoBtn} accessibilityLabel="Undo, that was not correct">
                <Text style={styles.undoText}>Undo</Text>
              </Pressable>
            )}
          </View>
        )}
        {useHost && status === 'running' && !room.hostConnected && (
          <View style={styles.banner}><Text style={styles.bannerText}>Host disconnected · tap your own side for now</Text></View>
        )}
        <View style={styles.controls}>
          <Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.ctrl}>✕</Text></Pressable>
          {status === 'running' && <Pressable onPress={() => setStatus('paused')} hitSlop={10}><Text style={styles.ctrl}>❚❚</Text></Pressable>}
        </View>
      </View>

      <PlayerZone
        side="a" name={names.a} ms={time.a} score={score.a} active={turn === 'a'} running={status === 'running' && !passing}
        rotated={false} judgeMode={judgeMode}
        onCorrect={correct} onPass={() => pass('a')}
      />

      {status !== 'running' && (
        <View style={styles.overlay}>
          {status === 'lobby' && (
            <>
              <Text style={styles.overlayKicker}>Room code</Text>
              <Text style={styles.roomCode}>{roomCode}</Text>
              <Text style={styles.overlaySub}>
                On the host's phone: open Swipe&Learn › Compete › Be the host, and enter this code. The host sees the answers
                and decides what's right, so nobody can cheat.
              </Text>
              <Text style={[styles.overlaySub, { color: room.hostConnected ? colors.knew : '#ffffff90', fontWeight: '800' }]}>
                {room.hostConnected ? '✓ Host connected' : room.linked ? 'Waiting for the host…' : 'Connecting…'}
              </Text>
              {room.hostConnected && <BigButton title="Continue" onPress={() => setStatus('ready')} />}
              <Pressable onPress={() => { setUseHost(false); setStatus('ready'); }}>
                <Text style={styles.link}>Play without a host</Text>
              </Pressable>
            </>
          )}
          {status === 'ready' && (
            <>
              <Text style={styles.overlayTitle}>{names[turn]} starts</Text>
              <Text style={styles.overlaySub}>
                {judgeMode === 'host'
                  ? 'Shout answers out loud. Your clock keeps running until the host taps Correct, so wrong guesses just cost time. Pass costs 3 seconds.'
                  : 'Name it out loud, then tap your side. If the other side disagrees, they can tap Undo. Pass costs 3 seconds.'}
              </Text>
              <BigButton title="Go!" onPress={() => setStatus('running')} />
            </>
          )}
          {status === 'paused' && (
            <>
              <Text style={styles.overlayTitle}>Paused</Text>
              <BigButton title="Resume" onPress={() => setStatus('running')} />
            </>
          )}
          {status === 'over' && winner && (
            <>
              <Text style={[styles.overlayKicker, { color: SIDE_COLOR[winner] }]}>Round over</Text>
              <Text style={styles.overlayTitle}>{names[winner]} wins! 🎉</Text>
              <Text style={styles.scoreLine}>
                <Text style={{ color: SIDE_COLOR.a }}>{names.a} {score.a}</Text>
                <Text>  –  </Text>
                <Text style={{ color: SIDE_COLOR.b }}>{score.b} {names.b}</Text>
              </Text>
              <BigButton title="Next round" onPress={rematch} />
              <Pressable onPress={() => router.back()}><Text style={styles.link}>End game</Text></Pressable>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function PlayerZone({
  side, name, ms, score, active, running, rotated, judgeMode, onCorrect, onPass,
}: {
  side: Side; name: string; ms: number; score: number; active: boolean; running: boolean; rotated: boolean;
  judgeMode: JudgeMode; onCorrect: () => void; onPass: () => void;
}) {
  const color = SIDE_COLOR[side];
  const low = ms < 10000;
  const selfTap = judgeMode === 'self' && active && running;

  return (
    <Pressable
      onPress={onCorrect}
      disabled={!selfTap}
      style={[
        styles.zone,
        { backgroundColor: active ? color : '#2A2840' },
        rotated && { transform: [{ rotate: '180deg' }] },
      ]}
      accessibilityLabel={selfTap ? `${name}: tap when correct` : name}
    >
      <View style={styles.zoneRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.zoneName} numberOfLines={1}>{name}</Text>
          <Text style={styles.zoneScore}>{score} {score === 1 ? 'win' : 'wins'}</Text>
        </View>
        <Text style={[styles.clock, low && active && { color: '#FFE4E6' }]}>{(ms / 1000).toFixed(1)}</Text>
      </View>

      {active && running ? (
        <View style={styles.zoneRow}>
          <Text style={styles.zoneHint}>
            {judgeMode === 'host' ? 'Say your answer out loud. The host decides.' : 'Tap anywhere here when you get it'}
          </Text>
          <Pressable onPress={onPass} style={styles.passBtn} hitSlop={8}><Text style={styles.passText}>Pass</Text></Pressable>
        </View>
      ) : (
        <Text style={styles.zoneHint}>{running ? 'Waiting…' : ' '}</Text>
      )}
    </Pressable>
  );
}

function PartyCard({ card, answer, emoji, showAnswer }: { card: Card; answer: string; emoji: string; showAnswer: boolean }) {
  const pic = useCardPicture(card);
  return (
    <View style={styles.card}>
      {pic.source ? <Image source={pic.source} style={StyleSheet.absoluteFill} contentFit="contain" /> : pic.ready ? <Text style={{ fontSize: 72 }}>{emoji}</Text> : <ActivityIndicator />}
      {showAnswer && (
        <View style={styles.answerBar}><Text style={styles.answerText}>Pass · it was {answer}</Text></View>
      )}
    </View>
  );
}

function BigButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.bigBtn}><Text style={styles.bigBtnText}>{title}</Text></Pressable>
  );
}

function buzz(kind: 'light' | 'success' | 'error') {
  if (Platform.OS === 'web') return;
  if (kind === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  else Haptics.notificationAsync(kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#16142B' },
  center: { flex: 1, backgroundColor: '#16142B', alignItems: 'center', justifyContent: 'center', gap: 16 },
  zone: { flex: 1, margin: 10, borderRadius: radius.lg, padding: 18, justifyContent: 'space-between' },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  zoneName: { color: '#fff', fontSize: 22, fontWeight: '900' },
  zoneScore: { color: '#ffffffb0', fontWeight: '700' },
  clock: { color: '#fff', fontSize: 52, fontWeight: '900', fontVariant: ['tabular-nums'] },
  zoneHint: { color: '#ffffffc0', fontWeight: '700', flex: 1 },
  passBtn: { backgroundColor: '#00000033', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
  passText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  middle: { flex: 1.6, marginHorizontal: 10 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  answerBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#16142BE6', padding: 14 },
  answerText: { color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  flash: { position: 'absolute', bottom: 12, alignSelf: 'center', borderRadius: 999, paddingLeft: 16, paddingRight: 6, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 },
  undoBtn: { backgroundColor: '#ffffff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  undoText: { color: colors.ink, fontWeight: '900' },
  roomCode: { color: '#fff', fontSize: 64, fontWeight: '900', letterSpacing: 10 },
  banner: { position: 'absolute', top: 12, left: 12, right: 60, backgroundColor: colors.forgot, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  bannerText: { color: '#fff', fontWeight: '800', fontSize: 13, textAlign: 'center' },
  flashText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  controls: { position: 'absolute', top: 10, right: 12, flexDirection: 'row', gap: 16 },
  ctrl: { fontSize: 18, fontWeight: '900', color: '#16142B', backgroundColor: '#ffffffd0', borderRadius: 14, paddingHorizontal: 8, overflow: 'hidden' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#16142BF7', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  overlayKicker: { fontWeight: '900', color: '#ffffffa0', textTransform: 'uppercase', letterSpacing: 1 },
  overlayTitle: { color: '#fff', fontSize: 32, fontWeight: '900', textAlign: 'center' },
  overlaySub: { color: '#ffffffc0', fontSize: 16, textAlign: 'center' },
  scoreLine: { color: '#fff', fontSize: 22, fontWeight: '900' },
  bigBtn: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 40, paddingVertical: 16, marginTop: 10 },
  bigBtnText: { color: '#16142B', fontSize: 20, fontWeight: '900' },
  link: { color: '#ffffffc0', fontWeight: '700', fontSize: 16, marginTop: 8 },
});
