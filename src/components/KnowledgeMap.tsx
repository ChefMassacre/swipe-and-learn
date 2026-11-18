import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, GestureResponderEvent, LayoutChangeEvent, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { useStore } from '../lib/store';
import { canPlay, topicProgress } from '../lib/selectors';
import { buildMap, MapHub, MapTopic, WORLD_W, WORLD_H } from '../lib/mapLayout';
import { F, colors, darker } from '../lib/theme';

const MIN_SCALE = 0.25;
const MAX_SCALE = 2.2;
const TAP_SLOP = 6;

type View2D = { x: number; y: number; s: number };
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * A pan-and-zoom map of every topic. Drag with one finger, pinch with two.
 * On the web, the mouse wheel zooms. Buttons cover zoom in, zoom out and fit.
 */
export function KnowledgeMap({ focusTopicIds = [] }: { focusTopicIds?: string[] }) {
  const map = useMemo(buildMap, []);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const view = useRef<View2D>({ x: 0, y: 0, s: 0.5 });
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const sc = useRef(new Animated.Value(0.5)).current;
  const [zoomedIn, setZoomedIn] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const containerRef = useRef<any>(null);
  const origin = useRef({ x: 0, y: 0 });

  const sizeRef = useRef({ w: 0, h: 0 });
  /** Keeps the middle of the screen somewhere over the map so it can't be lost off-screen. */
  const bound = (v: View2D): View2D => {
    const { w, h } = sizeRef.current;
    if (!w) return v;
    return { s: v.s, x: clamp(v.x, w / 2 - WORLD_W * v.s, w / 2), y: clamp(v.y, h / 2 - WORLD_H * v.s, h / 2) };
  };

  const apply = (raw: View2D) => {
    const v = bound(raw);
    view.current = v;
    tx.setValue(v.x);
    ty.setValue(v.y);
    sc.setValue(v.s);
    const z = v.s > 0.62;
    setZoomedIn((prev) => (prev === z ? prev : z));
  };

  const animateTo = (v: View2D) => {
    const from = { ...view.current };
    const p = new Animated.Value(0);
    const id = p.addListener(({ value }) =>
      apply({ x: from.x + (v.x - from.x) * value, y: from.y + (v.y - from.y) * value, s: from.s + (v.s - from.s) * value }),
    );
    Animated.timing(p, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(() => p.removeListener(id));
  };

  const fitView = (w = size.w, h = size.h): View2D => {
    const s = clamp(Math.min(w / WORLD_W, h / WORLD_H) * 1.02, MIN_SCALE, MAX_SCALE);
    return { s, x: (w - WORLD_W * s) / 2, y: (h - WORLD_H * s) / 2 };
  };

  /** Centre the view on a world point at a given zoom. */
  const focusOn = (wx: number, wy: number, s: number): View2D => ({ s, x: size.w / 2 - wx * s, y: size.h / 2 - wy * s });

  const zoomAround = (factor: number, cx = size.w / 2, cy = size.h / 2, base = view.current): View2D => {
    const s = clamp(base.s * factor, MIN_SCALE, MAX_SCALE);
    const wx = (cx - base.x) / base.s, wy = (cy - base.y) / base.s;
    return { s, x: cx - wx * s, y: cy - wy * s };
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    const first = size.w === 0;
    setSize({ w, h });
    sizeRef.current = { w, h };
    containerRef.current?.measureInWindow?.((x: number, y: number) => (origin.current = { x, y }));
    if (first) {
      // Start on the user's interests if they picked any, otherwise show everything.
      const focus = map.topics.filter((t) => focusTopicIds.includes(t.topic.id));
      if (focus.length) {
        const cx = focus.reduce((a, t) => a + t.x, 0) / focus.length;
        const cy = focus.reduce((a, t) => a + t.y, 0) / focus.length;
        apply({ s: 0.55, x: w / 2 - cx * 0.55, y: h / 2 - cy * 0.55 });
      } else apply(fitView(w, h));
    }
  };

  // Gesture state for drag and pinch.
  const g = useRef({ base: view.current, startX: 0, startY: 0, dist: 0, mid: { x: 0, y: 0 }, touches: 0 });
  const local = (e: GestureResponderEvent) =>
    e.nativeEvent.touches.map((t) => ({ x: t.pageX - origin.current.x, y: t.pageY - origin.current.y }));
  const begin = (pts: { x: number; y: number }[]) => {
    g.current.base = { ...view.current };
    g.current.touches = pts.length;
    if (pts.length >= 2) {
      g.current.dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      g.current.mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    } else if (pts.length === 1) {
      g.current.startX = pts[0].x;
      g.current.startY = pts[0].y;
    }
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (e) => e.nativeEvent.touches.length >= 2,
        onMoveShouldSetPanResponder: (e, s) => e.nativeEvent.touches.length >= 2 || Math.abs(s.dx) > TAP_SLOP || Math.abs(s.dy) > TAP_SLOP,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => begin(local(e)),
        onPanResponderMove: (e) => {
          const pts = local(e);
          if (pts.length !== g.current.touches) return begin(pts); // finger added or lifted
          const b = g.current.base;
          if (pts.length >= 2) {
            const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
            const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
            const s = clamp(b.s * (dist / (g.current.dist || 1)), MIN_SCALE, MAX_SCALE);
            const wx = (g.current.mid.x - b.x) / b.s, wy = (g.current.mid.y - b.y) / b.s;
            apply({ s, x: mid.x - wx * s, y: mid.y - wy * s });
          } else if (pts.length === 1) {
            apply({ s: b.s, x: b.x + pts[0].x - g.current.startX, y: b.y + pts[0].y - g.current.startY });
          }
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Mouse wheel / trackpad zoom on the web.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = containerRef.current as unknown as HTMLElement | null;
    if (!el?.addEventListener) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      apply(zoomAround(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w]);

  return (
    <View ref={containerRef} style={styles.container} onLayout={onLayout} {...responder.panHandlers}>
      <Dots />
      <Animated.View
        style={[styles.world, { transform: [{ translateX: tx }, { translateY: ty }, { scale: sc }] }]}
      >
        <Edges edges={map.edges} />
        {map.hubs.map((h) => (
          <Hub key={h.cat.id} hub={h} onPress={() => animateTo(focusOn(h.x, h.y, Math.max(view.current.s, 0.9)))} />
        ))}
        {map.topics.map((t) => (
          <TopicNode key={t.topic.id} node={t} detailed={zoomedIn} starred={focusTopicIds.includes(t.topic.id)} />
        ))}
      </Animated.View>

      <View style={styles.controls}>
        <MapButton label="+" onPress={() => animateTo(zoomAround(1.5))} />
        <MapButton label="−" onPress={() => animateTo(zoomAround(1 / 1.5))} />
        <MapButton label="⤢" onPress={() => animateTo(fitView())} />
      </View>
      <View style={styles.legend} pointerEvents="none">
        <View style={styles.legendRow}><View style={[styles.legendLine, { backgroundColor: colors.muted }]} /><Text style={styles.legendText}>Topic</Text></View>
        <View style={styles.legendRow}>
          <View style={{ flexDirection: 'row', gap: 3 }}>{[0, 1, 2].map((i) => <View key={i} style={styles.legendDash} />)}</View>
          <Text style={styles.legendText}>Similar ideas</Text>
        </View>
      </View>
    </View>
  );
}

function Edges({ edges }: { edges: ReturnType<typeof buildMap>['edges'] }) {
  return (
    <Svg width={WORLD_W} height={WORLD_H} style={StyleSheet.absoluteFill} pointerEvents="none">
      {edges.map((e, i) => {
        // Gentle curve: bend each line a little to one side of the straight path.
        const mx = (e.from.x + e.to.x) / 2, my = (e.from.y + e.to.y) / 2;
        const dx = e.to.x - e.from.x, dy = e.to.y - e.from.y;
        const bend = e.kind === 'related' ? 0.18 : 0.08;
        const cx = mx - dy * bend, cy = my + dx * bend;
        return (
          <Path
            key={i}
            d={`M ${e.from.x} ${e.from.y} Q ${cx} ${cy} ${e.to.x} ${e.to.y}`}
            stroke={e.kind === 'related' ? e.color + 'AA' : e.color + (e.color.length === 7 && e.color !== '#D9D2E4' ? '66' : '')}
            strokeWidth={e.kind === 'related' ? 4 : 6}
            strokeDasharray={e.kind === 'related' ? '2 12' : undefined}
            strokeLinecap="round"
            fill="none"
          />
        );
      })}
    </Svg>
  );
}

const HUB = 132;
function Hub({ hub, onPress }: { hub: MapHub; onPress: () => void }) {
  const c = hub.cat.color;
  return (
    <Pressable onPress={onPress} style={[styles.abs, { left: hub.x - HUB / 2, top: hub.y - HUB / 2 }]}>
      {({ pressed }) => (
        <View style={{ borderRadius: HUB, backgroundColor: darker(c, 0.22), paddingBottom: pressed ? 0 : 8, marginTop: pressed ? 8 : 0 }}>
          <View style={[styles.hub, { backgroundColor: c }]}>
            <Text style={styles.hubText} numberOfLines={3} adjustsFontSizeToFit>{hub.cat.title}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const NODE = 92;
function TopicNode({ node, detailed, starred }: { node: MapTopic; detailed: boolean; starred: boolean }) {
  const { state } = useStore();
  const { topic, cat } = node;
  const soon = topic.cards.length === 0;
  const locked = !soon && !canPlay(topic, state);
  const p = topicProgress(topic, state);
  const pct = Math.round(p.mastery * 100);
  const bg = soon ? '#F3F1F6' : locked ? '#ECE8F2' : colors.card;
  const ring = soon ? '#D8D2E2' : locked ? '#CFC8DB' : cat.color;

  return (
    <Pressable
      disabled={soon}
      onPress={() => router.push(`/topic/${topic.id}`)}
      style={[styles.abs, { left: node.x - 90, top: node.y - NODE / 2, width: 180, alignItems: 'center' }]}
    >
      {({ pressed }) => (
        <>
          <View style={{ borderRadius: NODE, backgroundColor: darker(ring, 0.12), paddingBottom: pressed ? 0 : 6, marginTop: pressed ? 6 : 0 }}>
            <View style={[styles.node, { backgroundColor: bg, borderColor: ring }, soon && { borderStyle: 'dashed' }]}>
              <Text style={{ fontSize: 40, opacity: soon || locked ? 0.45 : 1 }}>{topic.emoji}</Text>
            </View>
          </View>
          {locked && <View style={styles.badge}><Text style={{ fontSize: 14 }}>🔒</Text></View>}
          {starred && !locked && !soon && <View style={[styles.badge, { backgroundColor: colors.gold }]}><Text style={styles.star}>★</Text></View>}
          <View style={styles.label}>
            <Text style={[styles.title, (soon || locked) && { color: colors.muted }]} numberOfLines={2}>{topic.title}</Text>
            {detailed && (
              <Text style={styles.meta}>
                {soon ? 'Coming soon' : locked ? 'Plus' : p.due ? `${p.due} to review` : `${pct}% mastered`}
              </Text>
            )}
            {!soon && !locked && (
              <View style={styles.meter}><View style={[styles.meterFill, { width: `${Math.max(pct, 4)}%`, backgroundColor: cat.color }]} /></View>
            )}
          </View>
        </>
      )}
    </Pressable>
  );
}

/** Subtle dotted paper behind the map so movement is visible. */
function Dots() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Static pattern; the map moves over it. */}
      {Array.from({ length: 24 }, (_, r) =>
        Array.from({ length: 14 }, (_, c) => (
          <Path key={`${r}-${c}`} d={`M ${c * 32 + 8} ${r * 32 + 8} h 0.1`} stroke="#E6DFD3" strokeWidth={3} strokeLinecap="round" />
        )),
      )}
    </Svg>
  );
}

function MapButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label === '+' ? 'Zoom in' : label === '−' ? 'Zoom out' : 'Show whole map'}>
      {({ pressed }) => (
        <View style={{ borderRadius: 14, backgroundColor: colors.lineDark, paddingBottom: pressed ? 0 : 4, marginTop: pressed ? 4 : 0 }}>
          <View style={styles.mapBtn}><Text style={styles.mapBtnText}>{label}</Text></View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden', backgroundColor: colors.bg },
  world: { position: 'absolute', left: 0, top: 0, width: WORLD_W, height: WORLD_H, transformOrigin: [0, 0, 0] },
  abs: { position: 'absolute' },
  hub: { width: HUB, height: HUB, borderRadius: HUB, alignItems: 'center', justifyContent: 'center', padding: 14, borderWidth: 5, borderColor: '#ffffff66' },
  hubText: { color: '#fff', fontFamily: F.display, fontSize: 19, textAlign: 'center', lineHeight: 23 },
  node: { width: NODE, height: NODE, borderRadius: NODE, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -2, right: 40, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.bg },
  star: { fontSize: 14, color: '#fff', fontFamily: F.black },
  label: { alignItems: 'center', marginTop: 6, backgroundColor: colors.bg + 'E6', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  title: { fontFamily: F.extra, fontSize: 17, color: colors.ink, textAlign: 'center' },
  meta: { fontFamily: F.body, fontSize: 13, color: colors.muted },
  meter: { width: 70, height: 6, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden', marginTop: 4 },
  meterFill: { height: 6, borderRadius: 3 },
  controls: { position: 'absolute', right: 14, bottom: 18, gap: 10 },
  mapBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.lineDark },
  mapBtnText: { fontFamily: F.black, fontSize: 22, color: colors.ink },
  legend: { position: 'absolute', left: 14, bottom: 18, backgroundColor: colors.card + 'F0', borderRadius: 14, padding: 10, gap: 6, borderWidth: 1.5, borderColor: colors.line },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendLine: { width: 22, height: 4, borderRadius: 2 },
  legendDash: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.muted },
  legendText: { fontFamily: F.bold, fontSize: 12, color: colors.muted },
});
