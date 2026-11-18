import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '../lib/theme';

export type SwipeDir = 'right' | 'left' | 'up';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const THRESHOLD_X = Math.min(120, SCREEN_W * 0.28);
const THRESHOLD_Y = 110;

/**
 * A flashcard you tap to flip, then swipe:
 *   right = I knew it, left = I didn't (learn it), up = not interested.
 * Swiping is locked until the card is flipped, so people can't claim they knew
 * an answer they never saw (that would break spaced repetition).
 */
export function SwipeCard({
  front, back, revealed, onReveal, onSwipe, swipeEnabled = true, swipeRef,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  revealed: boolean;
  onReveal: () => void;
  onSwipe: (dir: SwipeDir) => void;
  swipeEnabled?: boolean;
  /** Lets buttons outside the card trigger the same fly-out animation. */
  swipeRef?: React.MutableRefObject<((dir: SwipeDir) => void) | null>;
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  const flip = useRef(new Animated.Value(revealed ? 1 : 0)).current;
  const canSwipe = useRef(false);
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;
  canSwipe.current = revealed && swipeEnabled;

  useEffect(() => {
    Animated.spring(flip, { toValue: revealed ? 1 : 0, friction: 8, tension: 60, useNativeDriver: true }).start();
  }, [revealed, flip]);

  const flyOut = (dir: SwipeDir) => {
    const to = dir === 'right' ? { x: SCREEN_W * 1.5, y: 0 } : dir === 'left' ? { x: -SCREEN_W * 1.5, y: 0 } : { x: 0, y: -SCREEN_H };
    Animated.timing(pan, { toValue: to, duration: 220, useNativeDriver: true }).start(() => onSwipeRef.current(dir));
  };

  if (swipeRef) swipeRef.current = flyOut;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => canSwipe.current && (Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8),
        onPanResponderMove: (_, g) => pan.setValue({ x: g.dx, y: g.dy }),
        onPanResponderRelease: (_, g) => {
          if (g.dx > THRESHOLD_X || g.vx > 0.9) return flyOut('right');
          if (g.dx < -THRESHOLD_X || g.vx < -0.9) return flyOut('left');
          if (g.dy < -THRESHOLD_Y || g.vy < -0.9) return flyOut('up');
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () =>
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start(),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const rotate = pan.x.interpolate({ inputRange: [-SCREEN_W, 0, SCREEN_W], outputRange: ['-14deg', '0deg', '14deg'] });
  const knewOpacity = pan.x.interpolate({ inputRange: [0, THRESHOLD_X], outputRange: [0, 1], extrapolate: 'clamp' });
  const forgotOpacity = pan.x.interpolate({ inputRange: [-THRESHOLD_X, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const skipOpacity = pan.y.interpolate({ inputRange: [-THRESHOLD_Y, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const frontRot = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRot = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[styles.wrap, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }]}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => !revealed && onReveal()}
        accessibilityRole="button"
        accessibilityLabel={revealed ? 'Card revealed. Swipe right if you knew it, left to learn it, up to skip.' : 'Tap to reveal the answer'}
      >
        <Animated.View style={[styles.face, { transform: [{ perspective: 1200 }, { rotateY: frontRot }] }]}>
          {front}
        </Animated.View>
        <Animated.View style={[styles.face, { transform: [{ perspective: 1200 }, { rotateY: backRot }] }]}>
          {back}
        </Animated.View>
      </Pressable>

      <Animated.View pointerEvents="none" style={[styles.stamp, styles.stampLeft, { opacity: knewOpacity, borderColor: colors.knew }]}>
        <Text style={[styles.stampText, { color: colors.knew }]}>KNEW IT</Text>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.stamp, styles.stampRight, { opacity: forgotOpacity, borderColor: colors.forgot }]}>
        <Text style={[styles.stampText, { color: colors.forgot }]}>LEARN IT</Text>
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.stamp, styles.stampBottom, { opacity: skipOpacity, borderColor: colors.skip }]}>
        <Text style={[styles.stampText, { color: colors.skip }]}>NOT FOR ME</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  face: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    ...shadow,
  },
  stamp: { position: 'absolute', borderWidth: 4, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#ffffffee' },
  stampLeft: { top: 28, left: 22, transform: [{ rotate: '-12deg' }] },
  stampRight: { top: 28, right: 22, transform: [{ rotate: '12deg' }] },
  stampBottom: { bottom: 40, alignSelf: 'center' },
  stampText: { fontSize: 26, fontWeight: '900', letterSpacing: 1 },
});
