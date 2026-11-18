import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Chip, H1, H2, Muted } from '../../components/ui';
import { TOPICS } from '../../data/topics';
import { useStore } from '../../lib/store';
import { currentStreak, isMastered, levelFor } from '../../lib/srs';
import { colors } from '../../lib/theme';

const ACHIEVEMENTS = [
  { id: 'first', emoji: '🌱', title: 'First round', test: (s: Stats) => s.sessions >= 1 },
  { id: 'streak3', emoji: '🔥', title: '3-day streak', test: (s: Stats) => s.streak >= 3 },
  { id: 'streak7', emoji: '☄️', title: '7-day streak', test: (s: Stats) => s.streak >= 7 },
  { id: 'seen50', emoji: '🃏', title: '50 cards', test: (s: Stats) => s.seen >= 50 },
  { id: 'master10', emoji: '🧠', title: '10 mastered', test: (s: Stats) => s.mastered >= 10 },
  { id: 'lvl5', emoji: '⭐', title: 'Level 5', test: (s: Stats) => s.level >= 5 },
];
type Stats = { sessions: number; streak: number; seen: number; mastered: number; level: number };

export default function Profile() {
  const { state, setProfile, setPlus, reset } = useStore();
  const cards = Object.values(state.cards);
  const stats: Stats = {
    sessions: state.history.length,
    streak: currentStreak(state.streak, state.lastPlayedDay, Date.now()),
    seen: cards.filter((c) => c.reps > 0).length,
    mastered: cards.filter(isMastered).length,
    level: levelFor(state.xp).level,
  };
  const toggle = (id: string) => {
    const xs = state.profile.interests;
    setProfile({ interests: xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id] });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <H1>Profile</H1>

        <Card style={styles.account}>
          <View style={styles.avatar}><Text style={{ fontSize: 28 }}>🙂</Text></View>
          <View style={{ flex: 1 }}>
            <H2>Guest</H2>
            <Muted style={{ fontSize: 13 }}>Progress is saved on this phone. Google sign-in is coming soon.</Muted>
          </View>
        </Card>

        <Pressable onPress={() => router.push('/paywall')}>
          <Card style={[styles.account, { backgroundColor: colors.goldSoft }]}>
            <Text style={{ fontSize: 28 }}>👑</Text>
            <View style={{ flex: 1 }}>
              <H2>{state.plus ? 'You have Plus' : 'Get Swipe&Learn Plus'}</H2>
              <Muted style={{ fontSize: 13 }}>Every topic, no ads, unlimited reviews.</Muted>
            </View>
          </Card>
        </Pressable>

        <H2>Achievements</H2>
        <View style={styles.badges}>
          {ACHIEVEMENTS.map((a) => {
            const got = a.test(stats);
            return (
              <View key={a.id} style={[styles.badge, !got && { opacity: 0.35 }]}>
                <Text style={{ fontSize: 30 }}>{a.emoji}</Text>
                <Text style={styles.badgeText}>{a.title}</Text>
              </View>
            );
          })}
        </View>

        <H2>Your interests</H2>
        <View style={styles.chips}>
          {TOPICS.map((t) => (
            <Chip key={t.id} label={`${t.emoji} ${t.title}`} selected={state.profile.interests.includes(t.id)} onPress={() => toggle(t.id)} />
          ))}
        </View>

        <H2>Developer</H2>
        <Card style={styles.devRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.devTitle}>Plus unlocked</Text>
            <Muted style={{ fontSize: 13 }}>Test switch until in-app purchases are connected.</Muted>
          </View>
          <Switch value={state.plus} onValueChange={setPlus} />
        </Card>
        <Button
          title="Reset all progress"
          variant="ghost"
          onPress={() =>
            Alert.alert('Reset everything?', 'This clears your progress and restarts onboarding.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: () => { reset(); router.replace('/onboarding'); } },
            ])
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, gap: 14, paddingBottom: 40 },
  account: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { width: '30%', backgroundColor: colors.card, borderRadius: 16, padding: 12, alignItems: 'center', gap: 4 },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  devRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  devTitle: { fontWeight: '800', color: colors.ink, fontSize: 15 },
});
