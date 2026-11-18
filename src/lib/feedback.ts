import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// One place for every sound and buzz in the app, so the Profile switches
// cover all of them. Sounds are short, quiet and respect the phone's silent
// switch; haptics are light taps, never long buzzes.

export type Cue = 'flip' | 'knew' | 'learn' | 'skip' | 'wrong' | 'combo' | 'complete' | 'tap';

const SOURCES = {
  flip: require('../../assets/sounds/flip.wav'),
  knew: require('../../assets/sounds/knew.wav'),
  learn: require('../../assets/sounds/learn.wav'),
  skip: require('../../assets/sounds/skip.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  combo: require('../../assets/sounds/combo.wav'),
  complete: require('../../assets/sounds/complete.wav'),
} as const;

const VOLUME = 0.55;
let prefs = { sound: true, haptics: true };
const players: Partial<Record<keyof typeof SOURCES, AudioPlayer>> = {};
let audioReady = false;

/** Called by the store whenever the settings change. */
export function setFeedbackPrefs(p: { sound: boolean; haptics: boolean }) {
  prefs = p;
}

function ensureAudio() {
  if (audioReady) return;
  audioReady = true;
  // Mix with the user's music and stay quiet when the ringer is off.
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
}

function playSound(name: keyof typeof SOURCES) {
  try {
    ensureAudio();
    let p = players[name];
    if (!p) {
      p = createAudioPlayer(SOURCES[name]);
      p.volume = VOLUME;
      players[name] = p;
    }
    p.seekTo(0).catch(() => {});
    p.play();
  } catch {
    // Sound is a nice-to-have; never let it break the game.
  }
}

function buzz(cue: Cue) {
  if (Platform.OS === 'web') return;
  const run = (() => {
    switch (cue) {
      case 'knew':
      case 'complete':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'wrong':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      case 'combo':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      default:
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  })();
  run.catch(() => {});
}

/** Plays the sound and haptic for a moment in the game, if the user has them on. */
export function feedback(cue: Cue, opts: { sound?: boolean } = {}) {
  if (prefs.haptics) buzz(cue);
  if (prefs.sound && opts.sound !== false && cue !== 'tap') playSound(cue);
}
