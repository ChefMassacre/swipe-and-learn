import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Topic, categoryById } from '../data/topics';
import { useStore } from '../lib/store';
import { canPlay, topicProgress } from '../lib/selectors';
import { colors, radius, shadow } from '../lib/theme';
import { ProgressBar } from './ui';

export function TopicTile({ topic, highlight, compact }: { topic: Topic; highlight?: boolean; compact?: boolean }) {
  const { state } = useStore();
  const cat = categoryById(topic.categoryId);
  const soon = topic.cards.length === 0;
  const locked = !soon && !canPlay(topic, state);
  const p = topicProgress(topic, state);

  return (
    <Pressable
      disabled={soon}
      onPress={() => router.push(`/topic/${topic.id}`)}
      style={({ pressed }) => [
        styles.tile,
        compact && styles.compact,
        highlight && { borderColor: cat.color },
        soon && { opacity: 0.55 },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={[styles.emojiBox, { backgroundColor: cat.color + '22' }]}>
        <Text style={{ fontSize: compact ? 26 : 30 }}>{topic.emoji}</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>{topic.title}</Text>
      {soon ? (
        <Text style={styles.meta}>Coming soon</Text>
      ) : locked ? (
        <Text style={[styles.meta, { color: colors.gold }]}>🔒 Plus</Text>
      ) : (
        <View style={{ gap: 4, alignSelf: 'stretch' }}>
          <ProgressBar value={p.mastery} color={cat.color} height={6} />
          <Text style={styles.meta}>
            {p.due ? `${p.due} due · ` : ''}{Math.round(p.mastery * 100)}% mastered
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 158, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, gap: 8,
    borderWidth: 2, borderColor: 'transparent', alignItems: 'flex-start', ...shadow,
  },
  compact: { width: '47%' as unknown as number },
  emojiBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 12, fontWeight: '600', color: colors.muted },
});
