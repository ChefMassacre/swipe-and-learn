import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
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
import { useCardPicture, CardPicture } from '../../lib/cardImage';
import { hasApprovedImage } from '../../data/topics';
import { F, colors, darker, radius } from '../../lib/theme';

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
  const [combo, setCombo] = useState(0);
  const [pops, setPops] = useState<{ id: number; text: string; color: string }[]>([]);
  const pop = (text: string, color: string) => {
    const id = Date.now() + Math.random();
    setPops((ps) => [...ps, { id, text, color }]);
    setTimeout(() => setPops((ps) => ps.filter((x) => x.id !== id)), 1100);
  };

  useEffect(() => {
    if (deck) prefetchWiki(deck.slice(index, index + 3).filter((cid) => !hasApprovedImage(cid)).map((cid) => cardById(cid)!.card.wiki));
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
    if (g === 'knew') {
      const gained = XP.knew + (mode === 'type' ? XP.typedBonus : 0);
      t.knew++; t.xp += gained;
      const c = combo + 1;
      setCombo(c);
      pop(c >= 3 ? `🔥 ${c} in a row! +${gained} XP` : `+${gained} XP`, c >= 3 ? colors.goldDark : colors.knewDark);
    }
    if (g === 'forgot') { t.forgot++; t.xp += XP.forgot; setCombo(0); pop(`+${XP.forgot} XP`, colors.primary); }
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
        <View style={{ flex: 1 }}><ProgressBar value={index / deck.length} height={16} /></View>
        {combo >= 2 ? (
          <Text style={[styles.counter, { color: colors.goldDark }]}>🔥 {combo}</Text>
        ) : (
          <Text style={styles.counter}>{index + 1}/{deck.length}</Text>
        )}
      </View>

      {phase === 'learn' ? (
        <LearnPanel card={card} onDone={advance} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.cardArea}>
            {deck.length - index > 2 && <View style={[styles.stackCard, { transform: [{ translateY: 22 }, { scale: 0.9 }] }]} />}
            {deck.length - index > 1 && <View style={[styles.stackCard, { transform: [{ translateY: 11 }, { scale: 0.95 }] }]} />}
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
            {pops.map((p) => <XpPop key={p.id} text={p.text} color={p.color} />)}
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
  const pic = useCardPicture(card);
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.imageBox}>
        <Picture pic={pic} emoji={topic.emoji} />
        {pic.unreviewed && pic.source ? <Text style={styles.unreviewed}>Unreviewed image</Text> : null}
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
  const pic = useCardPicture(card);
  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.imageBox, { flex: 1 }]}>
        <Picture pic={pic} emoji={topic.emoji} />
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
  const pic = useCardPicture(card);
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <ScrollView style={styles.learn} contentContainerStyle={{ padding: 20 }}>
        <View style={[styles.imageBox, { flex: 0, height: 220, borderRadius: radius.md }]}>
          {pic.source ? <Image source={pic.source} style={StyleSheet.absoluteFill} contentFit="contain" /> : null}
        </View>
        {pic.credit ? <Text style={styles.credit}>Photo: {pic.credit}</Text> : null}
        <Text style={styles.learnLabel}>Remember this one</Text>
        <Text style={styles.answer}>{card.answer}</Text>
        <Text style={styles.blurb}>{card.blurb}</Text>
        {wiki?.extract ? <Text style={[styles.muted, { marginTop: 12 }]} numberOfLines={6}>{wiki.extract}</Text> : null}
        <Pressable onPress={() => Linking.openURL(wiki?.url ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(card.wiki)}`)}>
          <Text style={styles.link}>Read more on Wikipedia ›</Text>
        </Pressable>
      </ScrollView>
      <Button title="Got it" variant="success" onPress={onDone} style={{ marginTop: 12 }} />
    </View>
  );
}

function Picture({ pic, emoji }: { pic: CardPicture; emoji: string }) {
  if (pic.source) return <Image source={pic.source} style={StyleSheet.absoluteFill} contentFit="contain" transition={150} />;
  if (pic.ready) return <Text style={styles.bigEmoji}>{emoji}</Text>;
  return <ActivityIndicator />;
}

function RoundAction({ label, icon, color, bg, onPress }: { label: string; icon: string; color: string; bg: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', flex: 1 }} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => (
        <>
          <View style={[styles.roundLip, { backgroundColor: darker(color, 0.22), paddingBottom: pressed ? 0 : 6, marginTop: pressed ? 6 : 0 }]}>
            <View style={[styles.round, { backgroundColor: color }]}>
              <Text style={{ fontSize: 28, fontFamily: F.black, color: '#fff' }}>{icon}</Text>
            </View>
          </View>
          <Text style={[styles.roundLabel, { color: darker(color, 0.2) }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

/** "+10 XP" that floats up and fades out over the card. */
function XpPop({ text, color }: { text: string; color: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pop, {
        opacity: v.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [20, -70] }) },
          { scale: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.6, 1.15, 1] }) },
        ],
      }]}
    >
      <Text style={[styles.popText, { color }]}>{text}</Text>
    </Animated.View>
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
  stackCard: { position: 'absolute', top: 20, left: 20, right: 20, bottom: 20, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.line },
  pop: { position: 'absolute', alignSelf: 'center', top: '38%', backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 2, borderColor: colors.line },
  popText: { fontFamily: F.black, fontSize: 18 },
  roundLip: { borderRadius: 40 },
  counter: { fontFamily: F.black, color: colors.muted, minWidth: 48, textAlign: 'right', fontSize: 15 },
  cardArea: { flex: 1, padding: 20 },
  imageBox: { flex: 3, backgroundColor: '#F4F1EC', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardFooter: { padding: 20, gap: 6 },
  topicTag: { fontSize: 12, fontFamily: F.black, color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  prompt: { fontSize: 24, fontFamily: F.display, color: colors.ink },
  tapHint: { fontSize: 13, color: colors.muted, marginTop: 4, fontFamily: F.bold },
  answer: { fontSize: 32, fontFamily: F.display, color: colors.ink, textAlign: 'center', letterSpacing: -0.5 },
  verdict: { fontSize: 16, fontFamily: F.extra, textAlign: 'center' },
  swipeLegend: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 12, fontFamily: F.bold },
  actions: { paddingHorizontal: 20, paddingBottom: 12, gap: 10 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  round: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  roundLabel: { fontSize: 12, fontFamily: F.black, marginTop: 6 },
  input: {
    backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 18, color: colors.ink, borderWidth: 2, borderBottomWidth: 4, borderColor: colors.lineDark, fontFamily: F.bold,
  },
  learn: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.line },
  learnLabel: { color: colors.forgotDark, fontFamily: F.black, marginTop: 16, textAlign: 'center', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 },
  blurb: { fontSize: 18, color: colors.ink, lineHeight: 26, marginTop: 10, fontFamily: F.body },
  link: { color: colors.primary, fontFamily: F.bold, marginTop: 16, fontSize: 16 },
  title: { fontSize: 28, fontFamily: F.display, color: colors.ink, marginTop: 8 },
  muted: { fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 21, fontFamily: F.body },
  bigEmoji: { fontSize: 72 },
  unreviewed: { position: 'absolute', top: 10, left: 10, backgroundColor: colors.goldSoft, color: '#92400E', fontSize: 11, fontFamily: F.extra, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  credit: { fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 6 },
});
