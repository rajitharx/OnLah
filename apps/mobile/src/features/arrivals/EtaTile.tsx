import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ArrivalTiming, CrowdLevel } from '../../types/domain';
import { WheelchairIcon } from '../../shared/components';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { busTypeLabel } from '../../shared/utils/busType';
import { getCrowdColor } from '../../shared/utils/crowdLevel';
import { tileLabel, tileSpokenLabel } from './tileModel';

interface EtaTileProps {
  timing: ArrivalTiming | null;
  now: number;
}

const CROWD_LEVELS: CrowdLevel[] = [0, 1, 2];
// One StyleSheet per level, built once, so the crowd fill never needs an inline style object.
const FILLS = CROWD_LEVELS.map(
  (level) => StyleSheet.create({ fill: { backgroundColor: getCrowdColor(level), borderColor: getCrowdColor(level) } }).fill,
);

// One tile: the minutes on a crowd-coloured fill, then the deck type, a crossed wheelchair when the bus is not
// accessible, and a LAST chip on the final bus of the day.
export function EtaTile({ timing, now }: EtaTileProps): React.JSX.Element {
  if (timing === null) {
    return (
      <View style={[styles.tile, styles.empty]} accessible accessibilityLabel={tileSpokenLabel(null, now)}>
        <Text allowFontScaling={true} style={styles.emptyValue}>—</Text>
        <Text allowFontScaling={true} style={styles.emptyFoot}>No bus</Text>
      </View>
    );
  }

  const { value, unit } = tileLabel(timing, now);
  return (
    <View
      style={[styles.tile, FILLS[timing.load]]}
      accessible
      accessibilityLabel={tileSpokenLabel(timing, now)}
    >
      {timing.isLastBus && (
        <View style={styles.last}>
          <Text allowFontScaling={true} style={styles.lastText}>LAST</Text>
        </View>
      )}
      <View style={styles.valueRow}>
        <Text allowFontScaling={true} style={styles.value}>{value}</Text>
        {unit !== null && <Text allowFontScaling={true} style={styles.unit}>{unit}</Text>}
      </View>
      <View style={styles.foot}>
        <Text allowFontScaling={true} style={styles.type}>{busTypeLabel(timing.type)}</Text>
        {!timing.isWheelchairAccessible && <WheelchairIcon size={12} color={colors.background} crossed />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.field,
  },
  empty: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  emptyValue: {
    ...typography.etaNumberCompact,
    color: colors.muted,
  },
  emptyFoot: {
    ...typography.caption,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  // The fill carries the crowd level, so the text switches to the dark background colour.
  value: {
    ...typography.etaNumberCompact,
    color: colors.background,
  },
  unit: {
    ...typography.caption,
    color: colors.background,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  type: {
    ...typography.caption,
    color: colors.background,
  },
  last: {
    position: 'absolute',
    top: -spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: spacing.xs,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  lastText: {
    ...typography.badge,
    color: colors.accent,
  },
});
