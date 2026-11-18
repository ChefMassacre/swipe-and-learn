import React from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, H1, H2, Kicker, Muted, Pill, ProgressBar } from '../../components/ui';
import { TopicTile } from '../../components/TopicTile';
import { useBounce } from '../../components/Confetti';
import { topicById, categoryById } from '../../data/topics';
import { useStore } from '../../lib/store';
import { allDueCardIds, recommendedTopics, topicProgress } from '../../lib/selectors';
import { currentStreak, dayKey, levelFor, DAY } from '../../lib/srs';
import { F, colors, darker, radius } from '../../lib/theme';

export default function Home() {
  const { state } = useStore();
  const now = Date.now();
  const streak = currentStreak(state.streak, state.lastPlayedDay, now);
  const playedToday = state.lastPlayedDay === dayKey(now);
  const due = allDueCardIds(state, now).length;
  const lvl = levelFor(state.xp);
  const last = state.lastTopicId ? topicById(state.lastTopicId) : undefined;
  const flame = useBounce(!playedToday);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.topBar}>
          <Animated.View style={flame}>
            <Pill icon="🔥" value={streak} color={playedToday ? colors.goldDark : colors.muted} bg={playedToday ? colors.goldSoft : colors.line} />
          </Animated.View>
          <Pill icon="⚡" value={state.xp} color={colors.primaryDark} bg={colors.primarySoft} />
          <View style={{ flex: 1 }} />
          <View style={styles.levelBadge}><Text style={styles.levelText}>Lv {lvl.level}</Text></View>
        </View>

        <View style={{ gap: 2 }}>
          <Kicker>{greeting()}</Kicker>
          <H1>{playedToday ? 'Nice, keep it rolling.' : 'Ready for a quick round?'}</H1>
        </View>

        <WeekStrip lastDay={state.lastPlayedDay} streak={streak} />

        <Pressable onPress={() => router.push('/play/daily')}>
          {({ pressed }) => (
            <View style={[styles.dailyLip, { paddingBottom: pressed ? 0 : 7, marginTop: pressed ? 7 : 0 }]}>
              <View style={styles.daily}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Kicker color="#ffffffb0">{playedToday ? 'Bonus round' : "Today's goal"}</Kicker>
                  <Text style={styles.dailyTitle}>Daily review</Text>
                  <Text style={styles.dailySub}>
                    {due ? `${due} card${due === 1 ? '' : 's'} ready, plus a few new ones` : 'A quick mix of new cards from your topics'}
                  </Text>
                  <View style={styles.dailyBtn}><Text style={styles.dailyBtnText}>START</Text></View>
                </View>
                <Text style={styles.dailyArt}>🃏</Text>
              </View>
            </View>
          )}
        </Pressable>

        <View style={styles.levelRow}>
          <Text style={styles.levelLabel}>Level {lvl.level}</Text>
          <View style={{ flex: 1 }}><ProgressBar value={lvl.into / lvl.needed} color={colors.gold} /></View>
          <Text style={styles.levelLabel}>{lvl.into}/{lvl.needed}</Text>
        </View>

        {last && last.cards.length > 0 && (
          <Pressable onPress={() => router.push(`/topic/${last.id}`)}>
            <Card style={styles.continue}>
              <View style={[styles.contIcon, { backgroundColor: categoryById(last.categoryId).color + '22' }]}>
                <Text style={{ fontSize: 30 }}>{last.emoji}</Text>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Kicker>Continue</Kicker>
                <H2>{last.title}</H2>
                <ProgressBar value={topicProgress(last, state).mastery} color={categoryById(last.categoryId).color} height={10} />
              </View>
            </Card>
          </Pressable>
        )}

        <H2 style={{ marginTop: 6 }}>For you</H2>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hscroll} style={{ marginHorizontal: -20 }}>
          {recommendedTopics(state).map((t) => (
            <TopicTile key={t.id} topic={t} highlight={state.profile.interests.includes(t.id)} />
          ))}
        </ScrollView>

        <Pressable onPress={() => router.push('/party')}>
          <Card style={[styles.party]}>
            <Text style={{ fontSize: 36 }}>🎉</Text>
            <View style={{ flex: 1 }}>
              <H2 style={{ color: '#fff' }}>Party mode</H2>
              <Muted style={{ color: '#ffffffb0' }}>Head-to-head with a clock for each side.</Muted>
            </View>
            <Text style={{ fontSize: 26, color: colors.gold, fontFamily: F.black }}>›</Text>
          </Card>
        </Pressable>
        <Pressable onPress={() => router.push('/party/host')} accessibilityRole="button">
          <Card style={styles.host}>
            <Text style={{ fontSize: 26 }}>📱</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.hostTitle}>Be the host</Text>
              <Muted style={{ fontSize: 14 }}>Judging a party game? Join with the room code.</Muted>
            </View>
            <Text style={{ fontSize: 22, color: colors.muted, fontFamily: F.black }}>›</Text>
          </Card>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Mon–Sun row showing which days of the current streak were played. */
function WeekStrip({ lastDay, streak }: { lastDay: string | null; streak: number }) {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const last = lastDay ? new Date(lastDay + 'T12:00:00').getTime() : 0;
  const days = Array.from({ length: 7 }, (_, i) => new Date(monday.getTime() + i * DAY + 12 * 3600 * 1000));
  return (
    <View style={styles.week}>
      {days.map((d, i) => {
        const t = d.getTime();
        const played = !!lastDay && t <= last + 1000 && t > last - streak * DAY;
        const today = dayKey(t) === dayKey(Date.now());
        return (
          <View key={i} style={{ alignItems: 'center', gap: 6, flex: 1 }}>
            <Text style={[styles.weekDay, today && { color: colors.ink }]}>{'MTWTFSS'[i]}</Text>
            <View style={[styles.weekDot, played && styles.weekDotOn, today && !played && styles.weekDotToday]}>
              {played && <Text style={{ fontSize: 14 }}>🔥</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, gap: 16, paddingBottom: 40 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelBadge: { backgroundColor: colors.ink, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  levelText: { color: '#fff', fontFamily: F.black, fontSize: 14 },
  week: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 8, borderWidth: 1.5, borderColor: colors.line },
  weekDay: { fontFamily: F.black, fontSize: 12, color: colors.muted },
  weekDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  weekDotOn: { backgroundColor: colors.goldSoft, borderWidth: 2, borderColor: colors.gold },
  weekDotToday: { borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed', backgroundColor: colors.card },
  dailyLip: { backgroundColor: colors.primaryDark, borderRadius: radius.lg },
  daily: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: 22, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  dailyTitle: { color: '#fff', fontSize: 30, fontFamily: F.display },
  dailySub: { color: '#ffffffd8', fontSize: 15, fontFamily: F.bold },
  dailyBtn: { alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10, marginTop: 12, borderBottomWidth: 4, borderBottomColor: darker('#ffffff', 0.15) },
  dailyBtnText: { color: colors.primaryDark, fontFamily: F.black, fontSize: 15, letterSpacing: 1 },
  dailyArt: { fontSize: 74, transform: [{ rotate: '12deg' }], marginRight: -6 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelLabel: { fontFamily: F.black, color: colors.muted, fontSize: 13 },
  continue: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  contIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  hscroll: { gap: 12, paddingVertical: 6, paddingHorizontal: 20 },
  host: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: -4 },
  hostTitle: { fontFamily: F.extra, fontSize: 16, color: colors.ink },
  party: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.ink, borderColor: colors.ink },
});
