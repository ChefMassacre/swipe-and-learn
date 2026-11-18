import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Chip, Muted } from '../../components/ui';
import { playableTopics } from '../../data/topics';
import { useStore } from '../../lib/store';
import { canPlay } from '../../lib/selectors';
import { colors, radius } from '../../lib/theme';

const CLOCKS = [30, 45, 60, 90];

export default function PartySetup() {
  const { state } = useStore();
  const topics = playableTopics().filter((t) => canPlay(t, state));
  const [teams, setTeams] = useState(false);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [seconds, setSeconds] = useState(45);
  const [picked, setPicked] = useState<string[]>([]);
  const [faceToFace, setFaceToFace] = useState(false);

  const toggle = (id: string) => setPicked((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
  const nameA = a.trim() || (teams ? 'Team 1' : 'Player 1');
  const nameB = b.trim() || (teams ? 'Team 2' : 'Player 2');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.body}>
        <Muted>
          Each side has its own clock. When it's your turn, name what's on screen out loud. Got it? Tap your side and the
          clock switches to your rival. Stuck? Pass, but the answer shows for 3 seconds while your clock keeps ticking.
          First to run out of time loses the round.
        </Muted>

        <Text style={styles.label}>Play as</Text>
        <View style={styles.chips}>
          <Chip label="👤  1 vs 1" selected={!teams} onPress={() => setTeams(false)} />
          <Chip label="👥  Teams" selected={teams} onPress={() => setTeams(true)} />
        </View>

        <Text style={styles.label}>{teams ? 'Team names' : 'Player names'}</Text>
        <TextInput value={a} onChangeText={setA} placeholder={teams ? 'Team 1' : 'Player 1'} placeholderTextColor={colors.muted} style={[styles.input, { borderColor: colors.primary }]} />
        <TextInput value={b} onChangeText={setB} placeholder={teams ? 'Team 2' : 'Player 2'} placeholderTextColor={colors.muted} style={[styles.input, { borderColor: colors.gold }]} />

        <Text style={styles.label}>Clock per side</Text>
        <View style={styles.chips}>
          {CLOCKS.map((s) => <Chip key={s} label={`${s}s`} selected={seconds === s} onPress={() => setSeconds(s)} />)}
        </View>

        <Text style={styles.label}>Topics</Text>
        <View style={styles.chips}>
          <Chip label="🎲  Mix of everything" selected={picked.length === 0} onPress={() => setPicked([])} />
          {topics.map((t) => <Chip key={t.id} label={`${t.emoji} ${t.title}`} selected={picked.includes(t.id)} onPress={() => toggle(t.id)} />)}
        </View>

        <Text style={styles.label}>Screen layout</Text>
        <View style={styles.chips}>
          <Chip label="📺  Same side / TV" selected={!faceToFace} onPress={() => setFaceToFace(false)} />
          <Chip label="🔄  Face to face" selected={faceToFace} onPress={() => setFaceToFace(true)} />
        </View>

        <View style={styles.tip}>
          <Text style={styles.tipTitle}>📺 Show it on the TV</Text>
          <Muted style={{ fontSize: 14 }}>
            iPhone: open Control Center › Screen Mirroring and pick your Apple TV or AirPlay TV. Android: swipe down › Cast or
            Smart View. Use “Same side / TV” so everything reads the right way up.
          </Muted>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          title="Start"
          onPress={() =>
            router.push({
              pathname: '/party/play',
              params: { a: nameA, b: nameB, seconds: String(seconds), topics: picked.join(','), flip: faceToFace ? '1' : '0' },
            })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 8, paddingBottom: 30 },
  label: { fontWeight: '800', color: colors.ink, fontSize: 15, marginTop: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  input: { backgroundColor: colors.card, borderRadius: radius.md, padding: 14, fontSize: 16, borderWidth: 2, color: colors.ink },
  tip: { backgroundColor: colors.card, borderRadius: radius.md, padding: 16, gap: 6, marginTop: 16 },
  tipTitle: { fontWeight: '800', color: colors.ink, fontSize: 15 },
  footer: { padding: 20 },
});
