import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, H1, Kicker, Muted } from '../../components/ui';
import { CATEGORIES, Category, TOPICS, Topic } from '../../data/topics';
import { useStore } from '../../lib/store';
import { canPlay, topicProgress } from '../../lib/selectors';
import { F, colors, darker, radius } from '../../lib/theme';

// The knowledge map: each category is a branch, and its topics hang off it as
// nodes along a winding path. A node's ring fills as you master the topic.
const OFFSETS = [0, 70, 0, -70];
const NODE = 84;

export default function Explore() {
  const { state, requestTopic } = useStore();
  const [req, setReq] = useState('');
  const interests = new Set(state.profile.interests);
  const cats = [...CATEGORIES].sort(
    (a, b) =>
      Number(TOPICS.some((t) => t.categoryId === b.id && interests.has(t.id))) -
      Number(TOPICS.some((t) => t.categoryId === a.id && interests.has(t.id))),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <Kicker color={colors.primary}>Knowledge map</Kicker>
        <H1>Explore</H1>
        <Muted>Every topic is a stop on the map. Fill the rings by mastering them.</Muted>

        {cats.map((cat) => {
          const ts = TOPICS.filter((t) => t.categoryId === cat.id);
          if (!ts.length) return null;
          return <Branch key={cat.id} cat={cat} topics={ts} interests={interests} />;
        })}

        <View style={styles.request}>
          <Text style={styles.reqTitle}>Want a topic we don't have?</Text>
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

function Branch({ cat, topics, interests }: { cat: Category; topics: Topic[]; interests: Set<string> }) {
  const { state } = useStore();
  const done = topics.filter((t) => t.cards.length && topicProgress(t, state).mastery >= 0.95).length;
  return (
    <View style={[styles.branch, { backgroundColor: cat.color + '0F', borderColor: cat.color + '33' }]}>
      <View style={styles.branchHead}>
        <View style={[styles.dot, { backgroundColor: cat.color }]} />
        <Text style={styles.branchTitle}>{cat.title}</Text>
        <Text style={[styles.branchMeta, { color: darker(cat.color, 0.15) }]}>{done}/{topics.length}</Text>
      </View>
      <View style={styles.path}>
        {topics.map((t, i) => (
          <View key={t.id} style={{ alignItems: 'center' }}>
            {i > 0 && <Connector from={OFFSETS[(i - 1) % 4]} to={OFFSETS[i % 4]} color={cat.color} />}
            <View style={{ transform: [{ translateX: OFFSETS[i % 4] }] }}>
              <Node topic={t} color={cat.color} starred={interests.has(t.id)} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Dotted trail between two nodes. */
function Connector({ from, to, color }: { from: number; to: number; color: string }) {
  const dots = 4;
  return (
    <View style={{ height: 44, justifyContent: 'space-evenly' }}>
      {Array.from({ length: dots }, (_, i) => {
        const x = from + ((to - from) * (i + 1)) / (dots + 1);
        return <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color + '66', transform: [{ translateX: x }] }} />;
      })}
    </View>
  );
}

function Node({ topic, color, starred }: { topic: Topic; color: string; starred: boolean }) {
  const { state } = useStore();
  const soon = topic.cards.length === 0;
  const locked = !soon && !canPlay(topic, state);
  const p = topicProgress(topic, state);
  const bg = soon ? '#F3F1F6' : locked ? '#EDEAF2' : color;
  const lip = soon ? '#E2DEE9' : locked ? '#D6D1E0' : darker(color, 0.2);
  const pct = Math.round(p.mastery * 100);

  return (
    <Pressable disabled={soon} onPress={() => router.push(`/topic/${topic.id}`)} style={{ alignItems: 'center', width: 150 }}>
      {({ pressed }) => (
        <>
          <View style={styles.nodeWrap}>
            <View style={[styles.nodeLip, { backgroundColor: lip, paddingBottom: pressed ? 0 : 6, marginTop: pressed ? 6 : 0 }]}>
              <View style={[styles.node, { backgroundColor: bg }, soon && styles.nodeSoon]}>
                <Text style={{ fontSize: 34, opacity: soon || locked ? 0.45 : 1 }}>{topic.emoji}</Text>
              </View>
            </View>
            {locked && <View style={styles.badge}><Text style={{ fontSize: 13 }}>🔒</Text></View>}
            {starred && !locked && !soon && <View style={[styles.badge, { backgroundColor: colors.gold }]}><Text style={styles.star}>★</Text></View>}
          </View>
          <Text style={[styles.nodeTitle, (soon || locked) && { color: colors.muted }]} numberOfLines={2}>{topic.title}</Text>
          {soon || locked ? (
            <Text style={styles.nodeMeta}>{soon ? 'Coming soon' : 'Plus'}</Text>
          ) : (
            <View style={styles.meter}>
              <View style={[styles.meterFill, { width: `${Math.max(pct, 4)}%`, backgroundColor: color }]} />
            </View>
          )}
          {!soon && !locked && <Text style={styles.nodeMeta}>{p.due ? `${p.due} to review` : `${pct}% mastered`}</Text>}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, gap: 14, paddingBottom: 48 },
  branch: { borderRadius: radius.lg, borderWidth: 1.5, paddingVertical: 18, marginTop: 6 },
  branchHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, marginBottom: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  branchTitle: { flex: 1, fontSize: 20, fontFamily: F.display, color: colors.ink },
  branchMeta: { fontFamily: F.black, fontSize: 14 },
  path: { alignItems: 'center' },
  nodeWrap: { alignItems: 'center', justifyContent: 'center' },
  nodeLip: { borderRadius: NODE },
  node: { width: NODE, height: NODE, borderRadius: NODE, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#ffffff55' },
  nodeSoon: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#CFC8DB' },
  badge: { position: 'absolute', top: -4, right: -6, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.bg },
  star: { fontSize: 13, color: '#fff', fontFamily: F.black },
  nodeTitle: { fontFamily: F.extra, fontSize: 15, color: colors.ink, textAlign: 'center', marginTop: 8 },
  meter: { width: 72, height: 6, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden', marginTop: 5 },
  meterFill: { height: 6, borderRadius: 3 },
  nodeMeta: { fontFamily: F.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  request: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, gap: 10, borderWidth: 1.5, borderColor: colors.line, marginTop: 10 },
  reqTitle: { fontSize: 18, fontFamily: F.display, color: colors.ink },
  input: { borderWidth: 2, borderColor: colors.line, borderRadius: radius.md, padding: 12, fontSize: 16, color: colors.ink, fontFamily: F.body },
});
