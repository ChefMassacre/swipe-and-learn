import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../lib/theme';

const PALETTE = [colors.primary, colors.knew, colors.gold, colors.forgot, colors.sky, '#FF8A3D'];

/** A one-shot burst of falling confetti. Purely decorative. */
export function Confetti({ count = 60, duration = 2600, delay = 0 }: { count?: number; duration?: number; delay?: number }) {
  const { width, height } = Dimensions.get('window');
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        drift: (Math.random() - 0.5) * 160,
        size: 7 + Math.random() * 7,
        color: PALETTE[i % PALETTE.length],
        spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
        round: Math.random() > 0.6,
        start: Math.random() * 400,
      })),
    [count, width],
  );
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [t, duration, delay]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => {
        const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [-40 - p.start, height + 40] });
        const translateX = t.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] });
        const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] });
        const opacity = t.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute', left: p.x, top: 0,
              width: p.size, height: p.round ? p.size : p.size * 0.45,
              borderRadius: p.round ? p.size : 2, backgroundColor: p.color, opacity,
              transform: [{ translateX }, { translateY }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}

/** Gentle repeating bounce, for the streak flame and similar flair. */
export function useBounce(active = true) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(1600),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, active]);
  return {
    transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) },
      { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
    ],
  };
}

/** Pops in from small to full size once. */
export function PopIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, friction: 5, tension: 120, delay, useNativeDriver: true } as any).start();
  }, [v, delay]);
  return <Animated.View style={[style, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}>{children}</Animated.View>;
}
