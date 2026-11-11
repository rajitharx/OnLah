import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, minTapSize, spacing, typography } from '../../shared/theme';
import { getCrowdLabel } from '../../shared/utils/crowdLevel';
import { collapseRail, type RailNode, type RailNodeState } from './railModel';
import { crowdLevelOf } from './trackerLabels';

const MARKER_SIZE = spacing.md;

interface RailProps {
  nodes: RailNode[];
  // Asked to scroll the screen so the bus stop is in view, with the y offset of that stop inside the rail.
  onFocusY?: (y: number) => void;
}

// One stop per node, in order. Passed stops are muted, stops after the user are lighter, and long stretches fold away.
export function Rail({ nodes, onFocusY }: RailProps): React.JSX.Element {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const focusIndex = nodes.findIndex((node) => node.hasBus);
  const [busY, setBusY] = useState<number | null>(null);
  const [railY, setRailY] = useState(0);

  // Scroll to the bus when it moves to a new stop, not on every 20 second refresh.
  useEffect(() => {
    if (busY !== null) onFocusY?.(railY + busY);
  }, [focusIndex, busY, railY]);

  return (
    <View accessibilityLabel="Stops on this route" onLayout={(event) => setRailY(event.nativeEvent.layout.y)}>
      {collapseRail(nodes, expanded).map((item) =>
        item.kind === 'gap' ? (
          <Pressable
            key={`gap-${item.key}`}
            onPress={() => setExpanded((previous) => new Set(previous).add(item.key))}
            accessibilityRole="button"
            accessibilityState={{ expanded: false }}
            accessibilityLabel={`Show ${item.count} more stops`}
            style={({ pressed }) => [styles.gap, pressed && styles.pressed]}
          >
            <Text allowFontScaling={true} style={styles.gapText}>+{item.count} stops</Text>
          </Pressable>
        ) : (
          <RailStop
            key={item.node.stop.sequence}
            node={item.node}
            onBusLayout={item.node.hasBus ? setBusY : undefined}
          />
        ),
      )}
    </View>
  );
}

function stopLabel(node: RailNode): string {
  const parts = [node.stop.description, node.stop.busStopCode];
  if (node.hasBus) parts.push('Bus is here');
  if (node.state === 'user') parts.push("You're here");
  return parts.join(', ');
}

function RailStop({ node, onBusLayout }: { node: RailNode; onBusLayout?: (y: number) => void }): React.JSX.Element {
  const { stop, state, hasBus, busLoad, isNext } = node;
  const crowd = busLoad === null ? null : crowdLevelOf(busLoad);

  return (
    <View
      style={styles.node}
      accessible
      accessibilityLabel={stopLabel(node)}
      onLayout={onBusLayout ? (event) => onBusLayout(event.nativeEvent.layout.y) : undefined}
    >
      <View style={styles.track}>
        <View style={[styles.marker, MARKERS[state], hasBus && styles.markerBus, isNext && styles.markerNext]} />
        <View style={styles.line} />
      </View>
      <View style={styles.body}>
        <Text allowFontScaling={true} style={[styles.name, NAMES[state]]}>{stop.description}</Text>
        <Text allowFontScaling={true} style={typography.caption}>
          {stop.busStopCode} · {stop.distanceKm.toFixed(1)} km
        </Text>
        {hasBus && (
          <Text allowFontScaling={true} style={styles.busTag}>
            Bus is here{crowd !== null ? ` · ${getCrowdLabel(crowd)}` : ''}
          </Text>
        )}
        {state === 'user' && <Text allowFontScaling={true} style={styles.userTag}>You're here</Text>}
      </View>
    </View>
  );
}

// Built once per state so no style object is created while rendering.
const MARKERS: Record<RailNodeState, object> = StyleSheet.create({
  passed: { backgroundColor: colors.border },
  bus: { backgroundColor: colors.accent },
  ahead: { backgroundColor: colors.muted },
  user: { backgroundColor: colors.accent, borderColor: colors.accent },
  beyond: { backgroundColor: colors.border },
});

const NAMES: Record<RailNodeState, object> = StyleSheet.create({
  passed: { color: colors.muted },
  bus: { color: colors.white },
  ahead: { color: colors.white },
  user: { color: colors.accent },
  beyond: { color: colors.muted },
});

const styles = StyleSheet.create({
  node: {
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: minTapSize,
  },
  track: {
    width: MARKER_SIZE,
    alignItems: 'center',
  },
  marker: {
    width: MARKER_SIZE / 2 + spacing.xs,
    height: MARKER_SIZE / 2 + spacing.xs,
    marginTop: spacing.xs,
    borderRadius: MARKER_SIZE,
    borderWidth: 1,
    borderColor: colors.border,
  },
  markerBus: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    marginTop: 0,
    borderColor: colors.white,
    borderWidth: 2,
  },
  markerNext: {
    borderColor: colors.accent,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  name: {
    ...typography.body,
    fontWeight: '600',
  },
  busTag: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
  },
  userTag: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
  },
  gap: {
    minHeight: minTapSize,
    marginLeft: MARKER_SIZE + spacing.md,
    justifyContent: 'center',
  },
  gapText: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
