import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, H1, Muted } from '../../components/ui';
import { TopicTile } from '../../components/TopicTile';
import { CATEGORIES, TOPICS } from '../../data/topics';
import { useStore } from '../../lib/store';
import { colors, radius } from '../../lib/theme';

// The topic map. v1 groups topics by category; a connected, Kinnu-style
// map view is planned (see docs/PRODUCT_SPEC.md).
export default function Explore() {
  const { state, requestTopic } = useStore();
  const [req, setReq] = useState('');
  const interests = new Set(state.profile.interests);
  // Show categories the user picked first.
  const cats = [...CATEGORIES].sort(
    (a, b) =>
      Number(TOPICS.some((t) => t.categoryId === b.id && interests.has(t.id))) -
      Number(TOPICS.some((t) => t.categoryId === a.id && interests.has(t.id))),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <H1>Explore</H1>
        <Muted>Every topic, grouped by what it's about.</Muted>
        {cats.map((cat) => {
          const ts = TOPICS.filter((t) => t.categoryId === cat.id);
          if (!ts.length) return null;
          return (
            <View key={cat.id} style={{ gap: 10 }}>
              <View style={styles.catHeader}>
                <View style={[styles.dot, { backgroundColor: cat.color }]} />
                <Text style={styles.catTitle}>{cat.title}</Text>
              </View>
              <View style={styles.grid}>
                {ts.map((t) => <TopicTile key={t.id} topic={t} compact highlight={interests.has(t.id)} />)}
              </View>
            </View>
          );
        })}

        <View style={styles.request}>
          <Text style={styles.catTitle}>Want a topic we don't have?</Text>
          <TextInput value={req} onChangeText={setReq} placeholder="e.g. Car logos, Birds, Paintings" placeholderTextColor={colors.muted} style={styles.input} />
          <Button
            title="Request topic"
            variant="secondary"
            disabled={!req.trim()}
            onPress={() => {
              requestTopic(req.trim());
              setReq('');
              Alert.alert('Thanks!', "We'll use your requests to decide what to add next.");
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, gap: 18, paddingBottom: 40 },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  catTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  request: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, gap: 10 },
  input: { borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.md, padding: 12, fontSize: 16, color: colors.ink },
});
