import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, StyleProp, TextStyle } from 'react-native';
import { colors, radius, shadow } from '../lib/theme';

export function Button({
  title, onPress, variant = 'primary', disabled, style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.primarySoft : 'transparent';
  const fg = variant === 'primary' ? '#fff' : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
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

export function ProgressBar({ value, color = colors.primary, height = 8 }: { value: number; color?: string; height?: number }) {
  return (
    <View style={{ height, borderRadius: height, backgroundColor: colors.line, overflow: 'hidden' }}>
      <View style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, height, backgroundColor: color }} />
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      <Text style={[styles.chipText, selected && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: radius.md, alignItems: 'center' },
  btnText: { fontSize: 17, fontWeight: '700' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, ...shadow },
  h1: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700', color: colors.ink },
  muted: { fontSize: 15, color: colors.muted, lineHeight: 21 },
  chip: {
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5,
    borderColor: colors.line, backgroundColor: colors.card, margin: 4,
  },
  chipText: { fontSize: 15, fontWeight: '600', color: colors.ink },
});
