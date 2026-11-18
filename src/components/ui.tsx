import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, StyleProp, TextStyle } from 'react-native';
import { colors, darker, F, radius, shadow } from '../lib/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'gold';
const VARIANTS: Record<Variant, { bg: string; lip: string; fg: string; border?: string }> = {
  primary: { bg: colors.primary, lip: colors.primaryDark, fg: '#fff' },
  success: { bg: colors.knew, lip: colors.knewDark, fg: '#fff' },
  danger: { bg: colors.forgot, lip: colors.forgotDark, fg: '#fff' },
  gold: { bg: colors.gold, lip: colors.goldDark, fg: '#3B2600' },
  secondary: { bg: colors.card, lip: colors.lineDark, fg: colors.primary, border: colors.lineDark },
  ghost: { bg: 'transparent', lip: 'transparent', fg: colors.primary },
};

/** Chunky button: sits on a darker "lip" and presses down when tapped. */
export function Button({
  title, onPress, variant = 'primary', disabled, style, color,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Custom background color (lip is derived). */
  color?: string;
}) {
  const v = VARIANTS[variant];
  const bg = color ?? v.bg;
  const lip = color ? darker(color) : v.lip;
  const flat = variant === 'ghost';
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} style={[{ opacity: disabled ? 0.45 : 1 }, style]}>
      {({ pressed }) => (
        <View style={[styles.lip, { backgroundColor: lip, paddingBottom: flat || pressed ? 0 : 5, marginTop: flat ? 0 : pressed ? 5 : 0 }]}>
          <View style={[styles.btn, { backgroundColor: bg }, v.border && { borderWidth: 2, borderColor: v.border }]}>
            <Text style={[styles.btnText, { color: v.fg }]}>{title}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function H1({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.h1, style]}>{children}</Text>;
}
export function H2({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.h2, style]}>{children}</Text>;
}
export function Muted({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}
export function Kicker({ children, color = colors.muted }: { children: React.ReactNode; color?: string }) {
  return <Text style={[styles.kicker, { color }]}>{children}</Text>;
}

export function ProgressBar({ value, color = colors.knew, height = 12 }: { value: number; color?: string; height?: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <View style={{ height, borderRadius: height, backgroundColor: colors.line, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height, borderRadius: height, backgroundColor: color }}>
        {pct > 6 && height >= 10 && (
          <View style={{ position: 'absolute', top: height * 0.22, left: height * 0.5, right: height * 0.5, height: Math.max(2, height * 0.22), borderRadius: 4, backgroundColor: '#ffffff55' }} />
        )}
      </View>
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && { backgroundColor: colors.primarySoft, borderColor: colors.primary },
        pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
      ]}
    >
      <Text style={[styles.chipText, selected && { color: colors.primaryDark }]}>{label}</Text>
    </Pressable>
  );
}

/** Small rounded counter, e.g. streak or XP in a header. */
export function Pill({ icon, value, color, bg }: { icon: string; value: string | number; color: string; bg: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={[styles.pillText, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lip: { borderRadius: radius.md },
  btn: { paddingVertical: 15, paddingHorizontal: 20, borderRadius: radius.md, alignItems: 'center' },
  btnText: { fontSize: 17, fontFamily: F.black, letterSpacing: 0.3 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, borderWidth: 1.5, borderColor: colors.line, ...shadow },
  h1: { fontSize: 32, fontFamily: F.display, color: colors.ink, letterSpacing: -0.6, lineHeight: 38 },
  h2: { fontSize: 21, fontFamily: F.display, color: colors.ink, letterSpacing: -0.2 },
  muted: { fontSize: 15, color: colors.muted, lineHeight: 22, fontFamily: F.body },
  kicker: { fontSize: 12, fontFamily: F.black, textTransform: 'uppercase', letterSpacing: 1.2 },
  chip: {
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderBottomWidth: 4,
    borderColor: colors.lineDark, backgroundColor: colors.card, margin: 4,
  },
  chipText: { fontSize: 15, fontFamily: F.extra, color: colors.ink },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  pillText: { fontSize: 16, fontFamily: F.black },
});
