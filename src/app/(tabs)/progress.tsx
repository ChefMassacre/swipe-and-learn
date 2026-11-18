import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, H1, H2, Muted, ProgressBar } from '../../components/ui';
import { categoryById, playableTopics, topicById } from '../../data/topics';
import { useStore } from '../../lib/store';
import { allDueCardIds, topicProgress } from '../../lib/selectors';
import { currentStreak, isMastered, levelFor } from '../../lib/srs';
import { colors } from '../../lib/theme';

export default function Progress() {
  const { state } = useStore();
  const now = Date.now();
  const learned = Object.values(state.cards).filter((s) => s.reps > 0 && !s.ignored).length;
  const mastered = Object.values(state.cards).filter((s) => isMastered(s)).length;
  const lvl = levelFor(state.xp);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <H1>Progress</H1>
        <View style={styles.stats}>
          <Stat label="Day streak" value={`🔥 ${currentStreak(state.streak, state.lastPlayedDay, now)}`} />
          <Stat label="Level" value={`${lvl.level}`} />
          <Stat label="Cards seen" value={`${learned}`} />
          <Stat label="Mastered" value={`${mastered}`} />
        </View>
        <Card style={{ gap: 4 }}>
          <H2>{allDueCardIds(state, now).length} cards due</H2>
          <Muted>Cards come back right before you'd forget them. Reviewing them on time is what makes it stick.</Muted>
        </Card>

        <H2>By topic</H2>
        {playableTopics().map((t) => {
          const p = topicProgress(t, state, now);
          const cat = categoryById(t.categoryId);
          return (
            <View key={t.id} style={styles.topicRow}>
              <Text style={{ fontSize: 26 }}>{t.emoji}</Text>
              <View style={{ flex: 1, gap: 6 }}>
                <View style={styles.topicHead}>
                  <Text style={styles.topicTitle}>{t.title}</Text>
                  <Text style={styles.pct}>{Math.round(p.mastery * 100)}%</Text>
                </View>
                <ProgressBar value={p.mastery} color={cat.color} />
                <Muted style={{ fontSize: 13 }}>{p.seen}/{p.total} seen · {p.mastered} mastered · {p.due} due</Muted>
              </View>
            </View>
          );
        })}

        <H2>Recent sessions</H2>
        {state.history.length === 0 ? (
          <Muted>Play a round and it'll show up here.</Muted>
        ) : (
          state.history.slice(0, 15).map((h) => {
            const t = h.topicId === 'daily' ? undefined : topicById(h.topicId);
            const total = h.knew + h.forgot;
            return (
              <View key={h.at} style={styles.histRow}>
                <Text style={{ fontSize: 20 }}>{t?.emoji ?? '📅'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topicTitle}>{t?.title ?? 'Daily review'}</Text>
                  <Muted style={{ fontSize: 13 }}>{new Date(h.at).toLocaleDateString()}</Muted>
                </View>
                <Text style={styles.pct}>{h.knew}/{total}</Text>
                <Text style={styles.xp}>+{h.xp} XP</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Muted style={{ fontSize: 13 }}>{label}</Muted>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, gap: 14, paddingBottom: 40 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { width: '47%', padding: 16, gap: 2 },
  statValue: { fontSize: 24, fontWeight: '900', color: colors.ink },
  topicRow: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.card, padding: 14, borderRadius: 16 },
  topicHead: { flexDirection: 'row', justifyContent: 'space-between' },
  topicTitle: { fontWeight: '800', fontSize: 15, color: colors.ink },
  pct: { fontWeight: '800', color: colors.ink },
  histRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  xp: { fontWeight: '800', color: colors.gold, minWidth: 60, textAlign: 'right' },
});
