import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SwipeCard, SwipeDir } from '../../components/SwipeCard';
import { Button, ProgressBar } from '../../components/ui';
import { cardById, topicById, Card, Topic } from '../../data/topics';
import { buildSession, answerMatches, Grade, shuffle } from '../../lib/srs';
import { useStore, XP } from '../../lib/store';
import { dailyPool } from '../../lib/selectors';
import { prefetchWiki, useWiki } from '../../lib/wiki';
import { colors, radius } from '../../lib/theme';

const SESSION_SIZE = 10;

type Phase = 'card' | 'learn';

export default function Play() {
  const { id, mode: modeParam } = useLocalSearchParams<{ id: string; mode?: string }>();
  const mode = modeParam === 'type' ? 'type' : 'flip';
  const { state, grade, finishSession } = useStore();
  const isDaily = id === 'daily';
  const topic = isDaily ? undefined : topicById(id);

  // Build the deck once when the screen opens.
  const [deck, setDeck] = useState<string[] | null>(null);
  useEffect(() => {
    const pool = isDaily ? dailyPool(state) : topic?.cards.map((c) => c.id) ?? [];
    setDeck(buildSession(pool, state.cards, Date.now(), SESSION_SIZE, isDaily ? 4 : SESSION_SIZE));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [phase, setPhase] = useState<Phase>('card');
  const [typed, setTyped] = useState('');
  const [typedCorrect, setTypedCorrect] = useState<boolean | null>(null);
  const tally = useRef({ knew: 0, forgot: 0, skipped: 0, xp: 0 });
  const swipeRef = useRef<((d: SwipeDir) => void) | null>(null);

  useEffect(() => {
    if (deck) prefetchWiki(deck.slice(index, index + 3).map((cid) => cardById(cid)!.card.wiki));
  }, [deck, index]);

  if (!deck) return <ActivityIndicator style={{ flex: 1 }} />;

  if (deck.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Stack.Screen options={{ title: '' }} />
        <Text style={styles.bigEmoji}>🎉</Text>
        <Text style={styles.title}>All caught up</Text>
        <Text style={styles.muted}>Nothing is due right now. Come back later, or practise anyway.</Text>
        <Button
          title="Practise anyway"
          style={{ marginTop: 24, alignSelf: 'stretch' }}
          onPress={() => {
            const pool = isDaily ? dailyPool(state) : topic?.cards.map((c) => c.id) ?? [];
            setDeck(shuffle(pool.filter((cid) => !state.cards[cid]?.ignored)).slice(0, SESSION_SIZE));
          }}
        />
        <Button title="Back" variant="ghost" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const entry = cardById(deck[index])!;
  const { card } = entry;
  const cardTopic = entry.topic;

  const advance = () => {
    const next = index + 1;
    if (next >= deck.length) {
      const t = tally.current;
      finishSession({ topicId: isDaily ? 'daily' : id, ...t });
      router.replace({
        pathname: '/results',
        params: { topicId: isDaily ? 'daily' : id, mode, knew: t.knew, forgot: t.forgot, skipped: t.skipped, xp: t.xp },
      });
      return;
    }
    setIndex(next);
    setRevealed(false);
    setPhase('card');
    setTyped('');
    setTypedCorrect(null);
  };

  const record = (g: Grade) => {
    grade(card.id, g);
    const t = tally.current;
    if (g === 'knew') { t.knew++; t.xp += XP.knew + (mode === 'type' ? XP.typedBonus : 0); }
    if (g === 'forgot') { t.forgot++; t.xp += XP.forgot; }
    if (g === 'ignore') t.skipped++;
  };

  const onSwipe = (dir: SwipeDir) => {
    haptic(dir === 'right' ? 'success' : 'light');
    if (dir === 'right') { record('knew'); advance(); }
    else if (dir === 'up') { record('ignore'); advance(); }
    else { record('forgot'); setPhase('learn'); }
  };

  const submitTyped = () => {
    const ok = answerMatches(typed, [card.answer, ...(card.aliases ?? [])]);
    setTypedCorrect(ok);
    setRevealed(true);
    haptic(ok ? 'success' : 'error');
  };

  const title = isDaily ? 'Daily review' : topic?.title ?? '';

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen options={{ title }} />
      <View style={styles.progressRow}>
        <View style={{ flex: 1 }}><ProgressBar value={index / deck.length} /></View>
        <Text style={styles.counter}>{index + 1}/{deck.length}</Text>
      </View>

      {phase === 'learn' ? (
        <LearnPanel card={card} onDone={advance} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.cardArea}>
            <SwipeCard
              key={card.id}
              swipeRef={swipeRef}
              revealed={revealed}
              swipeEnabled={mode === 'flip'}
              onReveal={() => { haptic('light'); setRevealed(true); }}
              onSwipe={onSwipe}
              front={<CardFront card={card} topic={cardTopic} showDaily={isDaily} />}
              back={<CardBack card={card} topic={cardTopic} typedCorrect={typedCorrect} typed={typed} />}
            />
          </View>

          {mode === 'type' ? (
            <View style={styles.actions}>
              {!revealed ? (
                <>
                  <TextInput
                    value={typed}
                    onChangeText={setTyped}
                    onSubmitEditing={submitTyped}
                    placeholder="Type your answer"
                    placeholderTextColor={colors.muted}
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="done"
                    style={styles.input}
                  />
                  <View style={styles.row}>
                    <Button title="I don't know" variant="secondary" style={{ flex: 1 }} onPress={() => { setTypedCorrect(false); setRevealed(true); }} />
                    <Button title="Check" style={{ flex: 1 }} onPress={submitTyped} disabled={!typed.trim()} />
                  </View>
                </>
              ) : (
                <View style={styles.row}>
                  <Button title="Not for me" variant="ghost" onPress={() => { record('ignore'); advance(); }} />
                  <Button
                    title={typedCorrect ? 'Next' : 'Learn it'}
                    style={{ flex: 1 }}
                    onPress={() => {
                      if (typedCorrect) { record('knew'); advance(); }
                      else { record('forgot'); setPhase('learn'); }
                    }}
                  />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.actions}>
              {!revealed ? (
                <Button title="Tap card to reveal" variant="secondary" onPress={() => setRevealed(true)} />
              ) : (
                <View style={styles.row}>
                  <RoundAction label="Didn't know" icon="✕" color={colors.forgot} bg={colors.forgotSoft} onPress={() => swipeRef.current?.('left')} />
                  <RoundAction label="Not for me" icon="↑" color={colors.skip} bg={colors.skipSoft} onPress={() => swipeRef.current?.('up')} />
                  <RoundAction label="Knew it" icon="✓" color={colors.knew} bg={colors.knewSoft} onPress={() => swipeRef.current?.('right')} />
                </View>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function CardFront({ card, topic, showDaily }: { card: Card; topic: Topic; showDaily: boolean }) {
  const wiki = useWiki(card.wiki);
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.imageBox}>
        {wiki?.image ? (
          <Image source={{ uri: wiki.image }} style={StyleSheet.absoluteFill} contentFit="contain" transition={150} />
        ) : wiki ? (
          <Text style={styles.bigEmoji}>{topic.emoji}</Text>
        ) : (
          <ActivityIndicator />
        )}
      </View>
      <View style={styles.cardFooter}>
        {showDaily && <Text style={styles.topicTag}>{topic.emoji} {topic.title}</Text>}
        <Text style={styles.prompt}>{topic.prompt}</Text>
        {card.hint ? <Text style={styles.muted}>{card.hint}</Text> : null}
        <Text style={styles.tapHint}>Say it in your head, then tap to flip</Text>
      </View>
    </View>
  );
}

function CardBack({ card, topic, typedCorrect, typed }: { card: Card; topic: Topic; typedCorrect: boolean | null; typed: string }) {
  const wiki = useWiki(card.wiki);
  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.imageBox, { flex: 1 }]}>
        {wiki?.image ? (
          <Image source={{ uri: wiki.image }} style={StyleSheet.absoluteFill} contentFit="contain" />
        ) : (
          <Text style={styles.bigEmoji}>{topic.emoji}</Text>
        )}
      </View>
      <View style={[styles.cardFooter, { flex: 1, justifyContent: 'center' }]}>
        {typedCorrect !== null && (
          <Text style={[styles.verdict, { color: typedCorrect ? colors.knew : colors.forgot }]}>
            {typedCorrect ? 'Correct!' : typed.trim() ? `Not quite: “${typed.trim()}”` : 'The answer is'}
          </Text>
        )}
        <Text style={styles.answer}>{card.answer}</Text>
        {typedCorrect === null && (
          <Text style={styles.swipeLegend}>← didn't know   ↑ not for me   knew it →</Text>
        )}
      </View>
    </View>
  );
}

function LearnPanel({ card, onDone }: { card: Card; onDone: () => void }) {
  const wiki = useWiki(card.wiki);
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <ScrollView style={styles.learn} contentContainerStyle={{ padding: 20 }}>
        <View style={[styles.imageBox, { height: 220, borderRadius: radius.md }]}>
          {wiki?.image ? <Image source={{ uri: wiki.image }} style={StyleSheet.absoluteFill} contentFit="contain" /> : null}
        </View>
        <Text style={styles.learnLabel}>Remember this one</Text>
        <Text style={styles.answer}>{card.answer}</Text>
        <Text style={styles.blurb}>{card.blurb}</Text>
        {wiki?.extract ? <Text style={[styles.muted, { marginTop: 12 }]} numberOfLines={6}>{wiki.extract}</Text> : null}
        <Pressable onPress={() => Linking.openURL(wiki?.url ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(card.wiki)}`)}>
          <Text style={styles.link}>Read more on Wikipedia ›</Text>
        </Pressable>
      </ScrollView>
      <Button title="Got it" onPress={onDone} style={{ marginTop: 12 }} />
    </View>
  );
}

function RoundAction({ label, icon, color, bg, onPress }: { label: string; icon: string; color: string; bg: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', flex: 1 }} accessibilityRole="button" accessibilityLabel={label}>
      <View style={[styles.round, { backgroundColor: bg }]}>
        <Text style={{ fontSize: 26, fontWeight: '900', color }}>{icon}</Text>
      </View>
      <Text style={[styles.roundLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

function haptic(kind: 'light' | 'success' | 'error') {
  if (Platform.OS === 'web') return;
  if (kind === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  else Haptics.notificationAsync(kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12 },
  counter: { fontWeight: '700', color: colors.muted, minWidth: 44, textAlign: 'right' },
  cardArea: { flex: 1, padding: 20 },
  imageBox: { flex: 3, backgroundColor: '#F1F0F7', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardFooter: { padding: 20, gap: 6 },
  topicTag: { fontSize: 13, fontWeight: '700', color: colors.primary },
  prompt: { fontSize: 22, fontWeight: '800', color: colors.ink },
  tapHint: { fontSize: 13, color: colors.muted, marginTop: 4 },
  answer: { fontSize: 28, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  verdict: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  swipeLegend: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 12 },
  actions: { paddingHorizontal: 20, paddingBottom: 12, gap: 10 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  round: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  roundLabel: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  input: {
    backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 18, color: colors.ink, borderWidth: 1.5, borderColor: colors.line,
  },
  learn: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg },
  learnLabel: { color: colors.forgot, fontWeight: '800', marginTop: 16, textAlign: 'center', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 },
  blurb: { fontSize: 17, color: colors.ink, lineHeight: 24, marginTop: 10 },
  link: { color: colors.primary, fontWeight: '700', marginTop: 16, fontSize: 16 },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink, marginTop: 8 },
  muted: { fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  bigEmoji: { fontSize: 72 },
});
