import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, H1, Muted } from '../components/ui';
import { topicById } from '../data/topics';
import { useStore } from '../lib/store';
import { currentStreak, levelFor } from '../lib/srs';
import { colors } from '../lib/theme';

export default function Results() {
  const p = useLocalSearchParams<{ topicId: string; mode: string; knew: string; forgot: string; skipped: string; xp: string }>();
  const { state } = useStore();
  const knew = Number(p.knew), forgot = Number(p.forgot), skipped = Number(p.skipped), xp = Number(p.xp);
  const total = knew + forgot;
  const pct = total ? Math.round((knew / total) * 100) : 0;
  const topic = p.topicId === 'daily' ? undefined : topicById(p.topicId);
  const streak = currentStreak(state.streak, state.lastPlayedDay, Date.now());
  const lvl = levelFor(state.xp);
  const headline = pct >= 90 ? 'Brilliant! 🤩' : pct >= 70 ? 'Nice work! 😎' : pct >= 40 ? 'Getting there! 💪' : 'Great start! 🌱';

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Text style={styles.kicker}>{topic ? `${topic.emoji} ${topic.title}` : '📅 Daily review'}</Text>
        <H1 style={{ textAlign: 'center' }}>{headline}</H1>
        <View style={styles.ring}>
          <Text style={styles.pct}>{pct}%</Text>
          <Muted>{knew} of {total} known</Muted>
        </View>

        <View style={styles.row}>
          <Pill color={colors.knew} bg={colors.knewSoft} n={knew} label="Knew" />
          <Pill color={colors.forgot} bg={colors.forgotSoft} n={forgot} label="Learning" />
          <Pill color={colors.skip} bg={colors.skipSoft} n={skipped} label="Skipped" />
        </View>

        <Card style={styles.reward}>
          <Text style={styles.rewardText}>+{xp} XP</Text>
          <Text style={styles.rewardText}>🔥 {streak} day{streak === 1 ? '' : 's'}</Text>
          <Text style={styles.rewardText}>Lv {lvl.level}</Text>
        </Card>
        {forgot > 0 && <Muted style={{ textAlign: 'center' }}>The {forgot} you missed will come back soon so they stick.</Muted>}
      </View>
      <View style={styles.footer}>
        <Button
          title="Play again"
          onPress={() => router.replace({ pathname: '/play/[id]', params: { id: p.topicId, mode: p.mode } })}
        />
        <Button title="Done" variant="secondary" onPress={() => router.dismissTo('/home')} />
      </View>
    </SafeAreaView>
  );
}

function Pill({ color, bg, n, label }: { color: string; bg: string; n: number; label: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillN, { color }]}>{n}</Text>
      <Text style={[styles.pillLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 16 },
  kicker: { fontWeight: '800', color: colors.primary },
  ring: { width: 180, height: 180, borderRadius: 90, borderWidth: 12, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  pct: { fontSize: 44, fontWeight: '900', color: colors.ink },
  row: { flexDirection: 'row', gap: 10 },
  pill: { borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', minWidth: 90 },
  pillN: { fontSize: 22, fontWeight: '900' },
  pillLabel: { fontSize: 12, fontWeight: '700' },
  reward: { flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'stretch' },
  rewardText: { fontWeight: '900', fontSize: 18, color: colors.ink },
  footer: { padding: 20, gap: 10 },
});
