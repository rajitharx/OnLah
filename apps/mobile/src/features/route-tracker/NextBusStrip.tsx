import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CrowdBadge } from '../../shared/components';
import { colors, radius, spacing, typography } from '../../shared/theme';
import type { TrackedBus } from '../../types/domain';
import { BusMarks } from './BusMarks';
import { crowdLevelOf, stopsAwayLabel } from './trackerLabels';

// The second and third buses. Empty slots are never passed in, so nothing blank is drawn.
export function NextBusStrip({ buses }: { buses: TrackedBus[] }): React.JSX.Element | null {
  if (buses.length === 0) return null;

  return (
    <View style={styles.section} accessibilityLabel="Later buses">
      <Text allowFontScaling={true} accessibilityRole="header" style={styles.label}>Later buses</Text>
      {buses.map((bus) => (
        <View key={bus.estimatedArrival} style={styles.bus}>
          <Text allowFontScaling={true} style={styles.eta}>{bus.etaLabel}</Text>
          <CrowdBadge level={crowdLevelOf(bus.load)} />
          <BusMarks bus={bus} />
          <Text allowFontScaling={true} style={typography.caption}>{stopsAwayLabel(bus.stopsAway, bus.etaLabel)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bus: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
  },
  eta: {
    ...typography.stopName,
  },
});
