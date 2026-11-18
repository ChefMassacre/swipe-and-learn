import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, H1, H2, Muted, ProgressBar } from '../../components/ui';
import { TopicTile } from '../../components/TopicTile';
import { topicById } from '../../data/topics';
import { useStore } from '../../lib/store';
import { allDueCardIds, recommendedTopics, topicProgress } from '../../lib/selectors';
import { currentStreak, dayKey, levelFor } from '../../lib/srs';
import { colors, radius } from '../../lib/theme';

export default function Home() {
  const { state } = useStore();
  const now = Date.now();
  const streak = currentStreak(state.streak, state.lastPlayedDay, now);
  const playedToday = state.lastPlayedDay === dayKey(now);
  const due = allDueCardIds(state, now).length;
  const lvl = levelFor(state.xp);
  const last = state.lastTopicId ? topicById(state.lastTopicId) : undefined;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.header}>
          <View>
            <Muted>{greeting()}</Muted>
            <H1>Ready to swipe?</H1>
          </View>
          <View style={[styles.streak, playedToday && { backgroundColor: colors.goldSoft }]}>
            <Text style={{ fontSize: 22, opacity: playedToday ? 1 : 0.5 }}>🔥</Text>
            <Text style={styles.streakNum}>{streak}</Text>
          </View>
        </View>

        <View style={styles.levelRow}>
          <Text style={styles.levelText}>Level {lvl.level}</Text>
          <View style={{ flex: 1 }}><ProgressBar value={lvl.into / lvl.needed} color={colors.gold} /></View>
          <Text style={styles.xp}>{state.xp} XP</Text>
        </View>

        <Pressable onPress={() => router.push('/play/daily')} style={({ pressed }) => [styles.daily, pressed && { opacity: 0.9 }]}>
          <Text style={styles.dailyKicker}>{playedToday ? 'Keep going' : "Today's goal"}</Text>
          <Text style={styles.dailyTitle}>Daily review</Text>
          <Text style={styles.dailySub}>
            {due ? `${due} card${due === 1 ? '' : 's'} ready to review, plus a few new ones` : 'A quick mix of new cards from your topics'}
          </Text>
          <View style={styles.dailyBtn}><Text style={styles.dailyBtnText}>Start  ›</Text></View>
        </Pressable>

        {last && last.cards.length > 0 && (
          <Pressable onPress={() => router.push(`/topic/${last.id}`)}>
            <Card style={styles.continue}>
              <Text style={{ fontSize: 34 }}>{last.emoji}</Text>
              <View style={{ flex: 1, gap: 6 }}>
                <Muted style={{ fontSize: 13 }}>Continue</Muted>
                <H2>{last.title}</H2>
                <ProgressBar value={topicProgress(last, state).mastery} />
              </View>
            </Card>
          </Pressable>
        )}

        <H2 style={{ marginTop: 8 }}>For you</H2>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hscroll}>
          {recommendedTopics(state).map((t) => (
            <TopicTile key={t.id} topic={t} highlight={state.profile.interests.includes(t.id)} />
          ))}
        </ScrollView>

        <Pressable onPress={() => router.push('/party')}>
          <Card style={styles.party}>
            <Text style={{ fontSize: 34 }}>🎉</Text>
            <View style={{ flex: 1 }}>
              <H2>Party mode</H2>
              <Muted>Two players, one phone, a ticking clock.</Muted>
            </View>
            <Text style={{ fontSize: 22, color: colors.muted }}>›</Text>
          </Card>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  streakNum: { fontSize: 18, fontWeight: '900', color: colors.ink },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelText: { fontWeight: '800', color: colors.ink },
  xp: { fontWeight: '700', color: colors.muted, fontSize: 13 },
  daily: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: 22, gap: 4 },
  dailyKicker: { color: '#ffffffb0', fontWeight: '800', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 },
  dailyTitle: { color: '#fff', fontSize: 28, fontWeight: '900' },
  dailySub: { color: '#ffffffd0', fontSize: 15 },
  dailyBtn: { alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10, marginTop: 12 },
  dailyBtnText: { color: colors.primary, fontWeight: '900', fontSize: 16 },
  continue: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  hscroll: { gap: 12, paddingVertical: 6, paddingRight: 20 },
  party: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});
