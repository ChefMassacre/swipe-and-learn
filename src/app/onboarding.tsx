import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, H1, Muted, ProgressBar } from '../components/ui';
import { CATEGORIES, TOPICS } from '../data/topics';
import { useStore } from '../lib/store';
import { F, colors, radius } from '../lib/theme';

const GOALS = [
  { id: 'trivia', label: '🏆  Win at trivia night' },
  { id: 'world', label: '🌍  Know more about the world' },
  { id: 'vocab', label: '📚  Grow my vocabulary' },
  { id: 'fun', label: '🎉  Just for fun' },
];
const MINUTES = [3, 5, 10, 15];

export default function Onboarding() {
  const { setProfile, requestTopic } = useStore();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<string>();
  const [minutes, setMinutes] = useState<number>();
  const [interests, setInterests] = useState<string[]>([]);
  const [request, setRequest] = useState('');

  const toggle = (id: string) =>
    setInterests((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));

  const finish = () => {
    if (request.trim()) requestTopic(request.trim());
    setProfile({ onboarded: true, goal, dailyMinutes: minutes, interests });
    const first = TOPICS.find((t) => interests.includes(t.id) && t.cards.length > 0 && t.free)
      ?? TOPICS.find((t) => t.free && t.cards.length > 0)!;
    router.replace('/home');
    router.push(`/play/${first.id}`);
  };

  return (
    <SafeAreaView style={styles.screen}>
      {step > 0 && (
        <View style={styles.top}>
          <Pressable onPress={() => setStep(step - 1)} hitSlop={12}><Text style={styles.back}>‹</Text></Pressable>
          <View style={{ flex: 1 }}><ProgressBar value={step / 4} /></View>
        </View>
      )}

      {step === 0 && (
        <View style={styles.hero}>
          <View style={styles.heroArt}>
            <View style={[styles.heroCard, { backgroundColor: colors.sky, transform: [{ rotate: '-14deg' }, { translateX: -46 }] }]}><Text style={styles.heroEmoji}>🏛️</Text></View>
            <View style={[styles.heroCard, { backgroundColor: colors.gold, transform: [{ rotate: '12deg' }, { translateX: 46 }] }]}><Text style={styles.heroEmoji}>🚜</Text></View>
            <View style={[styles.heroCard, { backgroundColor: colors.primary }]}><Text style={styles.heroEmoji}>🎮</Text></View>
          </View>
          <H1 style={{ textAlign: 'center', fontSize: 40, lineHeight: 46 }}>Swipe&Learn</H1>
          <Muted style={{ textAlign: 'center', fontSize: 17 }}>
            Learn about the world one swipe at a time. Consoles, philosophers, machines, fabrics and more.
          </Muted>
          <View style={{ flex: 1 }} />
          <Button title="Get started" onPress={() => setStep(1)} style={{ alignSelf: 'stretch' }} />
          <Muted style={{ fontSize: 13, marginTop: 8 }}>Sign in with Google is coming soon. Your progress is saved on this phone.</Muted>
        </View>
      )}

      {step === 1 && (
        <Question title="What brings you here?">
          {GOALS.map((g) => (
            <Option key={g.id} label={g.label} selected={goal === g.id} onPress={() => { setGoal(g.id); setStep(2); }} />
          ))}
        </Question>
      )}

      {step === 2 && (
        <Question title="How much time a day?" subtitle="You can change this any time.">
          {MINUTES.map((m) => (
            <Option key={m} label={`${m} minutes${m === 5 ? '  ·  recommended' : ''}`} selected={minutes === m} onPress={() => { setMinutes(m); setStep(3); }} />
          ))}
        </Question>
      )}

      {step === 3 && (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 24, gap: 6 }}>
            <H1>Pick your topics</H1>
            <Muted>Choose at least one. You can explore everything later.</Muted>
            {CATEGORIES.map((cat) => {
              const ts = TOPICS.filter((t) => t.categoryId === cat.id);
              if (!ts.length) return null;
              return (
                <View key={cat.id} style={{ marginTop: 18 }}>
                  <Text style={[styles.cat, { color: cat.color }]}>{cat.title}</Text>
                  <View style={styles.chips}>
                    {ts.map((t) => (
                      <Chip
                        key={t.id}
                        label={`${t.emoji} ${t.title}${t.cards.length ? '' : ' · soon'}`}
                        selected={interests.includes(t.id)}
                        onPress={() => toggle(t.id)}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
            <Text style={[styles.cat, { marginTop: 22 }]}>Missing something?</Text>
            <TextInput
              value={request}
              onChangeText={setRequest}
              placeholder="Request a topic (optional)"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </ScrollView>
          <View style={styles.footer}>
            <Button title="Continue" disabled={!interests.length} onPress={() => setStep(4)} />
          </View>
        </View>
      )}

      {step === 4 && (
        <View style={styles.body}>
          <H1>How to play</H1>
          <Muted>Look at the picture and answer in your head. Tap the card to flip it, then be honest:</Muted>
          <View style={{ gap: 12, marginTop: 20 }}>
            <Legend icon="→" color={colors.knew} bg={colors.knewSoft} title="Swipe right" text="I knew it. You'll see it again later to lock it in." />
            <Legend icon="←" color={colors.forgot} bg={colors.forgotSoft} title="Swipe left" text="I didn't know it. You get a quick summary, and it comes back soon." />
            <Legend icon="↑" color={colors.skip} bg={colors.skipSoft} title="Swipe up" text="Not for me. You won't see it again." />
          </View>
          <View style={{ flex: 1 }} />
          <Button title="Start my first round" onPress={finish} />
        </View>
      )}
    </SafeAreaView>
  );
}

function Question({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={styles.body}>
      <H1>{title}</H1>
      {subtitle ? <Muted>{subtitle}</Muted> : null}
      <View style={{ gap: 12, marginTop: 20 }}>{children}</View>
    </View>
  );
}

function Option({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.option, selected && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}>
      <Text style={styles.optionText}>{label}</Text>
    </Pressable>
  );
}

function Legend({ icon, color, bg, title, text }: { icon: string; color: string; bg: string; title: string; text: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendIcon, { backgroundColor: bg }]}><Text style={{ color, fontSize: 24, fontFamily: F.black }}>{icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.extra, fontSize: 16, color }}>{title}</Text>
        <Muted>{text}</Muted>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8 },
  back: { fontSize: 34, color: colors.ink, marginTop: -6 },
  hero: { flex: 1, alignItems: 'center', padding: 28, paddingTop: 60, gap: 12 },
  heroArt: { height: 200, width: 260, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroCard: { position: 'absolute', width: 120, height: 160, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#fff', shadowColor: '#2B1E5C', shadowOpacity: 0.15, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  heroEmoji: { fontSize: 56 },
  body: { flexGrow: 1, flex: 1, padding: 24, gap: 6 },
  footer: { padding: 20 },
  option: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: 18,
    borderWidth: 2, borderBottomWidth: 5, borderColor: colors.lineDark,
  },
  optionText: { fontSize: 17, fontFamily: F.extra, color: colors.ink },
  cat: { fontSize: 13, fontFamily: F.extra, textTransform: 'uppercase', letterSpacing: 1, color: colors.muted, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  input: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: 14, fontSize: 16,
    borderWidth: 1.5, borderColor: colors.line, color: colors.ink,
  },
  legend: { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: colors.card, padding: 14, borderRadius: radius.md, borderWidth: 2, borderColor: colors.line },
  legendIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
