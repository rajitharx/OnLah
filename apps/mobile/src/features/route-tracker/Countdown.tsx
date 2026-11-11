import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CrowdBadge } from '../../shared/components';
import { colors, radius, spacing, typography } from '../../shared/theme';
import type { TrackedBus, TrackerStatus } from '../../types/domain';
import { BusMarks } from './BusMarks';
import { crowdLevelOf, statusMessage, stopsAwayLabel } from './trackerLabels';

function etaText(bus: TrackedBus): string {
  return bus.etaLabel === 'Arr' ? 'under 1 min' : bus.etaLabel;
}

function positionNote(bus: TrackedBus): string {
  return bus.monitored ? 'Position not available, showing the ETA only' : 'Timetable estimate';
}

// The hero: how many stops away the next bus is. Without a position it shows the ETA alone, never a guessed count.
export function Countdown({ bus }: { bus: TrackedBus }): React.JSX.Element {
  const stopsText = stopsAwayLabel(bus.stopsAway, bus.etaLabel);

  return (
    <View style={styles.hero} accessibilityLabel="Next bus">
      <View accessibilityLiveRegion="polite">
        <Text allowFontScaling={true} style={styles.count}>{stopsText ?? bus.etaLabel}</Text>
        <Text allowFontScaling={true} style={typography.caption}>
          {stopsText === null ? positionNote(bus) : `ETA ${etaText(bus)}`}
        </Text>
      </View>
      <View style={styles.meta}>
        <CrowdBadge level={crowdLevelOf(bus.load)} />
        <BusMarks bus={bus} />
      </View>
    </View>
  );
}

// With no bus to count down, say why in LTA's own terms.
export function EmptyCountdown({ status }: { status: TrackerStatus }): React.JSX.Element | null {
  const message = statusMessage(status);
  if (message === null) return null;

  return (
    <View style={styles.hero} accessibilityLabel="Next bus">
      <View accessibilityLiveRegion="polite">
        <Text allowFontScaling={true} style={styles.emptyTitle}>{message.title}</Text>
        <Text allowFontScaling={true} style={typography.caption}>{message.detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
  },
  count: {
    ...typography.title,
  },
  emptyTitle: {
    ...typography.heading,
  },
  meta: {
    gap: spacing.sm,
  },
});
