// Visual language: playful and bold where you act (chunky buttons, bright
// colors, celebrations), calm and bookish where you read (warm paper
// background, serif headings, soft cards).

export const colors = {
  bg: '#FBF8F3', // warm paper
  card: '#FFFFFF',
  ink: '#1F1C2E',
  muted: '#77738A',
  line: '#ECE7F1',
  lineDark: '#DCD5E6',

  primary: '#7C5CFF',
  primaryDark: '#5B3BE0',
  primarySoft: '#F1ECFF',

  knew: '#22C55E',
  knewDark: '#16A34A',
  knewSoft: '#DCFCE7',
  forgot: '#FF4D6D',
  forgotDark: '#E11D48',
  forgotSoft: '#FFE4EA',
  skip: '#94A3B8',
  skipDark: '#64748B',
  skipSoft: '#EEF2F6',
  gold: '#FFB020',
  goldDark: '#E08E00',
  goldSoft: '#FFF4D6',
  sky: '#2EB5FF',
  skyDark: '#0B8FD6',
};

/** Font families, loaded in src/app/_layout.tsx. */
export const F = {
  display: 'Fraunces_700Bold', // headings: calm, bookish
  displayBlack: 'Fraunces_900Black',
  body: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extra: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
};

export const radius = { sm: 12, md: 18, lg: 26 };

export const shadow = {
  shadowColor: '#2B1E5C',
  shadowOpacity: 0.06,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 2,
};

/** Darker partner for a bright color, used for the "lip" under chunky buttons. */
export function darker(hex: string, amount = 0.18) {
  const n = parseInt(hex.slice(1, 7), 16);
  const f = (v: number) => Math.max(0, Math.round(v * (1 - amount)));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
