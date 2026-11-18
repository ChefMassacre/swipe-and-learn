import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, H1, Muted, ProgressBar } from '../../components/ui';
import { categoryById, topicById } from '../../data/topics';
import { useStore } from '../../lib/store';
import { canPlay, topicProgress } from '../../lib/selectors';
import { F, colors, radius } from '../../lib/theme';

const MODES = [
  { id: 'easy', title: 'Easy', desc: 'Pick from 4 answers. Great for a new topic.' },
  { id: 'flip', title: 'Classic', desc: 'Guess in your head, flip, and swipe.' },
  { id: 'type', title: 'Type it', desc: 'Type the answer. Harder, +5 XP per card.' },
] as const;

export default function TopicDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useStore();
  const topic = topicById(id);
  const [mode, setMode] = useState<'easy' | 'flip' | 'type'>('flip');
  if (!topic) return null;
  const cat = categoryById(topic.categoryId);
  const p = topicProgress(topic, state);
  const playable = canPlay(topic, state);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.emojiBox, { backgroundColor: cat.color + '22' }]}>
          <Text style={{ fontSize: 56 }}>{topic.emoji}</Text>
        </View>
        <Text style={[styles.cat, { color: cat.color }]}>{cat.title}</Text>
        <H1>{topic.title}</H1>
        <Muted style={{ fontSize: 16 }}>{topic.description}</Muted>

        <Card style={{ gap: 10, marginTop: 8 }}>
          <View style={styles.row}>
            <Text style={styles.label}>Mastery</Text>
            <Text style={styles.value}>{Math.round(p.mastery * 100)}%</Text>
          </View>
          <ProgressBar value={p.mastery} color={cat.color} />
          <View style={styles.statsRow}>
            <Mini n={p.total} label="cards" />
            <Mini n={p.fresh} label="new" />
            <Mini n={p.due} label="due" />
            <Mini n={p.mastered} label="mastered" />
          </View>
        </Card>

        <Text style={[styles.label, { marginTop: 8 }]}>Mode</Text>
        <View style={{ gap: 10 }}>
          {MODES.map((m) => (
            <Pressable key={m.id} onPress={() => setMode(m.id)} style={[styles.mode, mode === m.id && styles.modeOn]}>
              <View style={[styles.radio, mode === m.id && { borderColor: colors.primary, borderWidth: 7 }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.modeTitle}>{m.title}</Text>
                <Muted style={{ fontSize: 14 }}>{m.desc}</Muted>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        {playable ? (
          <Button title={p.seen === 0 ? 'Start' : p.due ? `Review ${Math.min(p.due, 10)} due` : 'Keep learning'} onPress={() => router.push({ pathname: '/play/[id]', params: { id: topic.id, mode } })} />
        ) : (
          <Button title="🔒  Unlock with Plus" onPress={() => router.push('/paywall')} />
        )}
      </View>
    </SafeAreaView>
  );
}

function Mini({ n, label }: { n: number; label: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.value}>{n}</Text>
      <Muted style={{ fontSize: 12 }}>{label}</Muted>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, gap: 8 },
  emojiBox: { width: 104, height: 104, borderRadius: 32, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  cat: { fontFamily: F.extra, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  statsRow: { flexDirection: 'row', marginTop: 4 },
  label: { fontFamily: F.extra, color: colors.ink, fontSize: 15 },
  value: { fontFamily: F.black, color: colors.ink, fontSize: 18 },
  mode: { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 16, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.lineDark },
  modeOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.line, backgroundColor: '#fff' },
  modeTitle: { fontFamily: F.extra, fontSize: 16, color: colors.ink },
  footer: { padding: 20 },
});
