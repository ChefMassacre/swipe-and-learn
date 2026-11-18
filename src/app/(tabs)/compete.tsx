import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, H1, H2, Muted } from '../../components/ui';
import { colors, radius } from '../../lib/theme';

export default function Compete() {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <H1>Compete</H1>

        <Pressable onPress={() => router.push('/party')} style={({ pressed }) => [styles.hero, pressed && { opacity: 0.9 }]}>
          <Text style={{ fontSize: 48 }}>🎉</Text>
          <Text style={styles.heroTitle}>Party mode</Text>
          <Text style={styles.heroSub}>
            Head-to-head on one phone. Each player has their own clock. Name it, tap your side, and the clock flips to your rival. Run out of time and you're out.
          </Text>
          <View style={styles.heroBtn}><Text style={styles.heroBtnText}>Play now  ›</Text></View>
        </Pressable>

        <Card style={{ gap: 6, opacity: 0.6 }}>
          <H2>🏆 Weekly leagues</H2>
          <Muted>Earn XP to climb from Bronze to Diamond against players at your level. Coming with accounts.</Muted>
        </Card>
        <Card style={{ gap: 6, opacity: 0.6 }}>
          <H2>⚔️ Challenge a friend</H2>
          <Muted>Send a topic battle and compare scores. Coming with accounts.</Muted>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, gap: 16 },
  hero: { backgroundColor: '#16142B', borderRadius: radius.lg, padding: 22, gap: 8 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '900' },
  heroSub: { color: '#ffffffc0', fontSize: 15, lineHeight: 21 },
  heroBtn: { alignSelf: 'flex-start', backgroundColor: colors.gold, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10, marginTop: 8 },
  heroBtnText: { color: '#16142B', fontWeight: '900', fontSize: 16 },
});
