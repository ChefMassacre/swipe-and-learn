import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { RAW_TOPICS } from '../../data/topicsData';
import { CARD_IMAGES } from '../../data/cardImages';
import { hostSyncAvailable, normalizeCode, PartyState, Side, useHostRoom } from '../../lib/partySync';
import { useWiki } from '../../lib/wiki';
import { F, colors, radius } from '../../lib/theme';

const SIDE_COLOR: Record<Side, string> = { a: colors.primary, b: colors.gold };
const allCards = new Map(RAW_TOPICS.flatMap((t) => t.cards.map((c) => [c.id, c] as const)));

// The host's phone: sees the answer and decides whether each guess is right.
export default function Host() {
  const [input, setInput] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const room = useHostRoom(code);

  if (!hostSyncAvailable) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Online play isn't set up</Text>
        <Text style={styles.sub}>Hosting needs the Supabase keys described in docs/PARTY_HOST.md.</Text>
      </SafeAreaView>
    );
  }

  if (!code) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Be the host</Text>
        <Text style={styles.sub}>Enter the room code shown on the game phone. You'll see each answer and decide if the players got it right.</Text>
        <TextInput
          value={input}
          onChangeText={(t) => setInput(normalizeCode(t))}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={4}
          placeholder="ABCD"
          placeholderTextColor="#ffffff40"
          style={styles.codeInput}
        />
        <Pressable disabled={input.length !== 4} onPress={() => setCode(input)} style={[styles.bigBtn, input.length !== 4 && { opacity: 0.4 }]}>
          <Text style={styles.bigBtnText}>Join</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const s = room.state;
  if (!s || !room.gameConnected) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.sub}>{room.joined ? `Looking for room ${code}… Keep the game phone on the party screen.` : 'Connecting…'}</Text>
        <Pressable onPress={() => setCode(null)}><Text style={styles.link}>Change code</Text></Pressable>
      </SafeAreaView>
    );
  }

  const judge = (action: 'correct' | 'wrong') => {
    Haptics.notificationAsync(action === 'correct' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
    room.judge(action);
  };
  const live = s.status === 'running' && !s.passing;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <Text style={styles.roomTag}>Hosting {code}</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.link}>Leave</Text></Pressable>
      </View>

      <View style={styles.clocks}>
        {(['a', 'b'] as Side[]).map((side) => (
          <View key={side} style={[styles.clockBox, { borderColor: SIDE_COLOR[side], backgroundColor: s.turn === side ? SIDE_COLOR[side] : 'transparent' }]}>
            <Text style={styles.clockName} numberOfLines={1}>{s.names[side]} · {s.score[side]}</Text>
            <Text style={styles.clockTime}>{(s.time[side] / 1000).toFixed(0)}s</Text>
          </View>
        ))}
      </View>

      <HostBody s={s} />

      <View style={styles.buttons}>
        <Pressable disabled={!live} onPress={() => judge('wrong')} style={[styles.judgeBtn, { backgroundColor: colors.forgot }, !live && styles.off]}>
          <Text style={styles.judgeText}>✗  Wrong</Text>
        </Pressable>
        <Pressable disabled={!live} onPress={() => judge('correct')} style={[styles.judgeBtn, { backgroundColor: colors.knew, flex: 1.5 }, !live && styles.off]}>
          <Text style={styles.judgeText}>✓  Correct</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function HostBody({ s }: { s: PartyState }) {
  if (s.status === 'over' && s.winner) {
    return (
      <View style={styles.body}>
        <Text style={styles.title}>{s.names[s.winner]} wins the round</Text>
        <Text style={styles.sub}>Waiting for the next round on the game phone…</Text>
      </View>
    );
  }
  if (s.status !== 'running') {
    return (
      <View style={styles.body}>
        <Text style={styles.title}>{s.status === 'paused' ? 'Paused' : 'Get ready'}</Text>
        <Text style={styles.sub}>{s.names[s.turn]} goes first. Listen for the answer, then tap Correct or Wrong.</Text>
      </View>
    );
  }
  return (
    <View style={styles.body}>
      <Text style={[styles.turn, { color: SIDE_COLOR[s.turn] }]}>{s.names[s.turn]} is answering</Text>
      {s.cardId && <Thumb cardId={s.cardId} />}
      <Text style={styles.answerLabel}>{s.passing ? 'Passed' : 'Answer'}</Text>
      <Text style={styles.answer}>{s.answer}</Text>
      {(allCards.get(s.cardId ?? '')?.aliases?.length ?? 0) > 0 && (
        <Text style={styles.sub}>Also OK: {allCards.get(s.cardId!)!.aliases!.join(', ')}</Text>
      )}
    </View>
  );
}

function Thumb({ cardId }: { cardId: string }) {
  const approved = CARD_IMAGES[cardId];
  const wiki = useWiki(approved ? undefined : allCards.get(cardId)?.wiki);
  const source = approved?.source ?? (wiki?.image ? { uri: wiki.image } : undefined);
  return <View style={styles.thumb}>{source ? <Image source={source} style={StyleSheet.absoluteFill} contentFit="contain" /> : null}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#16142B', padding: 16 },
  center: { flex: 1, backgroundColor: '#16142B', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomTag: { color: '#ffffffa0', fontFamily: F.extra, letterSpacing: 1 },
  title: { color: '#fff', fontSize: 28, fontFamily: F.black, textAlign: 'center' },
  sub: { color: '#ffffffb0', fontSize: 16, textAlign: 'center', lineHeight: 22 },
  link: { color: '#ffffffc0', fontFamily: F.bold, fontSize: 16 },
  codeInput: { color: '#fff', fontSize: 48, fontFamily: F.black, letterSpacing: 12, textAlign: 'center', borderBottomWidth: 3, borderColor: '#ffffff40', minWidth: 220, paddingVertical: 8 },
  bigBtn: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 40, paddingVertical: 16 },
  bigBtnText: { color: '#16142B', fontSize: 20, fontFamily: F.black },
  clocks: { flexDirection: 'row', gap: 10, marginTop: 12 },
  clockBox: { flex: 1, borderWidth: 2, borderRadius: radius.md, padding: 10 },
  clockName: { color: '#fff', fontFamily: F.extra },
  clockTime: { color: '#fff', fontSize: 28, fontFamily: F.black },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  turn: { fontSize: 18, fontFamily: F.black },
  thumb: { width: 160, height: 120, borderRadius: radius.md, backgroundColor: '#fff', overflow: 'hidden' },
  answerLabel: { color: '#ffffff90', fontFamily: F.extra, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
  answer: { color: '#fff', fontSize: 38, fontFamily: F.black, textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: 12 },
  judgeBtn: { flex: 1, borderRadius: radius.lg, paddingVertical: 28, alignItems: 'center' },
  judgeText: { color: '#fff', fontSize: 22, fontFamily: F.black },
  off: { opacity: 0.35 },
});
