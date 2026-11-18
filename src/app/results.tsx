import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, H1, Kicker, Muted } from '../components/ui';
import { Confetti, PopIn } from '../components/Confetti';
import { topicById } from '../data/topics';
import { useStore } from '../lib/store';
import { feedback } from '../lib/feedback';
import { currentStreak, levelFor } from '../lib/srs';
import { F, colors, radius } from '../lib/theme';

export default function Results() {
  const p = useLocalSearchParams<{ topicId: string; mode: string; knew: string; forgot: string; skipped: string; xp: string }>();
  const { state } = useStore();
  const knew = Number(p.knew), forgot = Number(p.forgot), skipped = Number(p.skipped), xp = Number(p.xp);
  const total = knew + forgot;
  const pct = total ? Math.round((knew / total) * 100) : 0;
  const topic = p.topicId === 'daily' ? undefined : topicById(p.topicId);
  const streak = currentStreak(state.streak, state.lastPlayedDay, Date.now());
  const lvl = levelFor(state.xp);
  const headline = pct >= 90 ? 'Brilliant!' : pct >= 70 ? 'Nice work!' : pct >= 40 ? 'Getting there!' : 'Great start!';
  const face = pct >= 90 ? '🤩' : pct >= 70 ? '😎' : pct >= 40 ? '💪' : '🌱';
  const shown = useCountUp(pct);
  useEffect(() => { feedback('complete'); }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Kicker color={colors.primary}>{topic ? `${topic.emoji}  ${topic.title}` : '📅  Daily review'}</Kicker>
        <PopIn><Text style={{ fontSize: 64 }}>{face}</Text></PopIn>
        <H1 style={{ textAlign: 'center' }}>{headline}</H1>

        <View style={styles.scoreRow}>
          <Text style={styles.pct}>{shown}%</Text>
          <Muted>{knew} of {total} known</Muted>
        </View>

        <View style={styles.tiles}>
          <PopIn delay={250} style={{ flex: 1 }}><Tile label="Total XP" value={`+${xp}`} color={colors.gold} icon="⚡" /></PopIn>
          <PopIn delay={400} style={{ flex: 1 }}><Tile label="Streak" value={`${streak}`} color={colors.forgot} icon="🔥" /></PopIn>
          <PopIn delay={550} style={{ flex: 1 }}><Tile label="Level" value={`${lvl.level}`} color={colors.primary} icon="⭐" /></PopIn>
        </View>

        <View style={styles.row}>
          <Stat color={colors.knewDark} n={knew} label="Knew" />
          <Stat color={colors.forgotDark} n={forgot} label="Learning" />
          <Stat color={colors.skipDark} n={skipped} label="Skipped" />
        </View>
        {forgot > 0 && <Muted style={{ textAlign: 'center' }}>The {forgot} you're learning will come back soon so they stick.</Muted>}
      </View>
      <View style={styles.footer}>
        <Button title="Continue" variant="success" onPress={() => router.dismissTo('/home')} />
        <Button
          title="Play again"
          variant="secondary"
          onPress={() => router.replace({ pathname: '/play/[id]', params: { id: p.topicId, mode: p.mode } })}
        />
      </View>
      {total > 0 && pct >= 40 && <Confetti />}
    </SafeAreaView>
  );
}

function useCountUp(target: number) {
  const v = useRef(new Animated.Value(0)).current;
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = v.addListener(({ value }) => setN(Math.round(value)));
    Animated.timing(v, { toValue: target, duration: 900, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => v.removeListener(id);
  }, [v, target]);
  return n;
}

function Tile({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <View style={[styles.tile, { borderColor: color }]}>
      <Text style={[styles.tileLabel, { backgroundColor: color }]}>{label}</Text>
      <View style={styles.tileBody}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
        <Text style={[styles.tileValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

function Stat({ color, n, label }: { color: string; n: number; label: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={[styles.statN, { color }]}>{n}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 14 },
  scoreRow: { alignItems: 'center' },
  pct: { fontSize: 64, fontFamily: F.displayBlack, color: colors.ink, letterSpacing: -2 },
  tiles: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 4 },
  tile: { borderWidth: 2.5, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.card },
  tileLabel: { color: '#fff', fontFamily: F.black, fontSize: 12, textAlign: 'center', paddingVertical: 4, textTransform: 'uppercase', letterSpacing: 0.8 },
  tileBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  tileValue: { fontFamily: F.black, fontSize: 22 },
  row: { flexDirection: 'row', alignSelf: 'stretch', marginTop: 6 },
  statN: { fontSize: 24, fontFamily: F.black },
  statLabel: { fontSize: 12, fontFamily: F.extra, color: colors.muted },
  footer: { padding: 20, gap: 12 },
});
