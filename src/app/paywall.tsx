import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, H1, Muted } from '../components/ui';
import { useStore } from '../lib/store';
import { F, colors } from '../lib/theme';

// Placeholder paywall. Real purchases (subscription + one-time unlock) will go
// through RevenueCat or expo-iap; see docs/PRODUCT_SPEC.md "Monetization".
export default function Paywall() {
  const { state } = useStore();
  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={{ fontSize: 64, textAlign: 'center' }}>👑</Text>
      <H1 style={{ textAlign: 'center' }}>Swipe&Learn Plus</H1>
      <Muted style={{ textAlign: 'center' }}>Learn without limits.</Muted>
      <View style={{ gap: 10, marginTop: 12 }}>
        {['Every topic, including new ones each month', 'No ads', 'Unlimited daily reviews', 'Type-it mode on every topic'].map((f) => (
          <Text key={f} style={styles.feature}>✓  {f}</Text>
        ))}
      </View>
      <Card style={styles.plan}>
        <Text style={styles.planTitle}>Yearly</Text>
        <Muted>Best value · free 7-day trial</Muted>
      </Card>
      <Card style={styles.plan}>
        <Text style={styles.planTitle}>Monthly</Text>
      </Card>
      <Card style={styles.plan}>
        <Text style={styles.planTitle}>Lifetime</Text>
        <Muted>Pay once, keep it forever</Muted>
      </Card>
      <Muted style={{ textAlign: 'center', fontSize: 13 }}>
        {state.plus ? 'Plus is on (test mode).' : 'Purchases are not connected yet. Use Profile › Developer to test Plus.'}
      </Muted>
      <Button title="Close" variant="secondary" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 24, gap: 12, backgroundColor: colors.bg, flexGrow: 1 },
  feature: { fontSize: 16, fontFamily: F.body, color: colors.ink },
  plan: { gap: 2 },
  planTitle: { fontFamily: F.black, fontSize: 18, color: colors.ink },
});
