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
import { prefetchWiki, useWiki } from '../../lib/wiki';
import { colors, radius } from '../../lib/theme';

type Side = 'a' | 'b';
const PASS_PENALTY_MS = 3000;
const TICK = 100;
const SIDE_COLOR: Record<Side, string> = { a: colors.primary, b: colors.gold };

// Party mode: a two-sided chess clock with picture cards in the middle.
export default function PartyPlay() {
  const params = useLocalSearchParams<{ a: string; b: string; seconds: string; topics: string; flip: string }>();
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
  const [status, setStatus] = useState<'ready' | 'running' | 'paused' | 'over'>('ready');
  const [passing, setPassing] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [score, setScore] = useState<Record<Side, number>>({ a: 0, b: 0 });
  const [winner, setWinner] = useState<Side | null>(null);
  const [starter, setStarter] = useState<Side>('a');
  const lastTick = useRef(Date.now());

  useEffect(() => { prefetchWiki(pool.map((id) => cardById(id)!.card.wiki)); }, [pool]);

  const card = cardById(deck[pos % deck.length])?.card;

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

  const correct = (side: Side) => {
    if (status !== 'running' || side !== turn || passing || !card) return;
    buzz('success');
    setFlash(`✓ ${card.answer}`);
    setTimeout(() => setFlash(null), 1200);
    nextCard();
    setTurn(side === 'a' ? 'b' : 'a');
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
        side="b" name={names.b} ms={time.b} score={score.b} active={turn === 'b'} running={status === 'running'}
        rotated={faceToFace} onCorrect={() => correct('b')} onPass={() => pass('b')}
      />

      <View style={styles.middle}>
        {card && <PartyCard wiki={card.wiki} answer={card.answer} emoji={cardById(deck[pos % deck.length])!.topic.emoji} showAnswer={passing} />}
        {flash && <View style={styles.flash}><Text style={styles.flashText}>{flash}</Text></View>}
        <View style={styles.controls}>
          <Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.ctrl}>✕</Text></Pressable>
          {status === 'running' && <Pressable onPress={() => setStatus('paused')} hitSlop={10}><Text style={styles.ctrl}>❚❚</Text></Pressable>}
        </View>
      </View>

      <PlayerZone
        side="a" name={names.a} ms={time.a} score={score.a} active={turn === 'a'} running={status === 'running'}
        rotated={false} onCorrect={() => correct('a')} onPass={() => pass('a')}
      />

      {status !== 'running' && (
        <View style={styles.overlay}>
          {status === 'ready' && (
            <>
              <Text style={styles.overlayTitle}>{names[turn]} starts</Text>
              <Text style={styles.overlaySub}>Name it out loud, then tap your side. Pass costs 3 seconds.</Text>
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
  side, name, ms, score, active, running, rotated, onCorrect, onPass,
}: {
  side: Side; name: string; ms: number; score: number; active: boolean; running: boolean; rotated: boolean;
  onCorrect: () => void; onPass: () => void;
}) {
  const color = SIDE_COLOR[side];
  const low = ms < 10000;
  return (
    <Pressable
      onPress={onCorrect}
      disabled={!active || !running}
      style={[
        styles.zone,
        { backgroundColor: active ? color : '#2A2840' },
        rotated && { transform: [{ rotate: '180deg' }] },
      ]}
      accessibilityLabel={`${name}: tap when correct`}
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
          <Text style={styles.zoneHint}>Tap anywhere here when you get it</Text>
          <Pressable onPress={onPass} style={styles.passBtn} hitSlop={8}><Text style={styles.passText}>Pass</Text></Pressable>
        </View>
      ) : (
        <Text style={styles.zoneHint}>{running ? 'Waiting…' : ' '}</Text>
      )}
    </Pressable>
  );
}

function PartyCard({ wiki, answer, emoji, showAnswer }: { wiki: string; answer: string; emoji: string; showAnswer: boolean }) {
  const w = useWiki(wiki);
  return (
    <View style={styles.card}>
      {w?.image ? <Image source={{ uri: w.image }} style={StyleSheet.absoluteFill} contentFit="contain" /> : w ? <Text style={{ fontSize: 72 }}>{emoji}</Text> : <ActivityIndicator />}
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
  flash: { position: 'absolute', bottom: 12, alignSelf: 'center', backgroundColor: colors.knew, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  flashText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  controls: { position: 'absolute', top: 10, right: 12, flexDirection: 'row', gap: 16 },
  ctrl: { fontSize: 18, fontWeight: '900', color: '#16142B', backgroundColor: '#ffffffd0', borderRadius: 14, paddingHorizontal: 8, overflow: 'hidden' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#16142BEE', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  overlayKicker: { fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  overlayTitle: { color: '#fff', fontSize: 32, fontWeight: '900', textAlign: 'center' },
  overlaySub: { color: '#ffffffc0', fontSize: 16, textAlign: 'center' },
  scoreLine: { color: '#fff', fontSize: 22, fontWeight: '900' },
  bigBtn: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 40, paddingVertical: 16, marginTop: 10 },
  bigBtnText: { color: '#16142B', fontSize: 20, fontWeight: '900' },
  link: { color: '#ffffffc0', fontWeight: '700', fontSize: 16, marginTop: 8 },
});
