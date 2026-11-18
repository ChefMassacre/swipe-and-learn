import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, H1, Kicker } from '../../components/ui';
import { KnowledgeMap } from '../../components/KnowledgeMap';
import { useStore } from '../../lib/store';
import { F, colors, radius } from '../../lib/theme';

// Explore: a map of every category and topic. Drag to move, pinch to zoom.
// Dotted lines join similar topics across categories.
export default function Explore() {
  const { state, requestTopic } = useStore();
  const [asking, setAsking] = useState(false);
  const [req, setReq] = useState('');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Kicker color={colors.primary}>Knowledge map</Kicker>
          <H1>Explore</H1>
          <Text style={styles.hint}>Drag to move · pinch to zoom · tap a topic</Text>
        </View>
        <Pressable onPress={() => setAsking((a) => !a)} style={styles.reqBtn} accessibilityRole="button">
          <Text style={styles.reqBtnText}>＋ Request</Text>
        </Pressable>
      </View>

      <KnowledgeMap focusTopicIds={state.profile.interests} />

      {asking && (
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Want a topic we don't have?</Text>
          <TextInput autoFocus value={req} onChangeText={setReq} placeholder="e.g. Car logos, Birds, Paintings" placeholderTextColor={colors.muted} style={styles.input} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Cancel" variant="secondary" style={{ flex: 1 }} onPress={() => setAsking(false)} />
            <Button
              title="Send"
              style={{ flex: 1 }}
              disabled={!req.trim()}
              onPress={() => {
                requestTopic(req.trim());
                setReq('');
                setAsking(false);
                Alert.alert('Thanks!', "We'll use your requests to decide what to add next.");
              }}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10, borderBottomWidth: 1.5, borderBottomColor: colors.line, backgroundColor: colors.bg, zIndex: 2 },
  hint: { fontFamily: F.bold, fontSize: 13, color: colors.muted, marginTop: 2 },
  reqBtn: { backgroundColor: colors.primarySoft, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 2, borderColor: colors.primary, marginBottom: 4 },
  reqBtnText: { fontFamily: F.black, color: colors.primaryDark, fontSize: 14 },
  sheet: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, gap: 12, borderWidth: 2, borderColor: colors.line, shadowColor: '#2B1E5C', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  sheetTitle: { fontFamily: F.display, fontSize: 20, color: colors.ink },
  input: { borderWidth: 2, borderColor: colors.line, borderRadius: radius.md, padding: 12, fontSize: 16, color: colors.ink, fontFamily: F.body },
});
