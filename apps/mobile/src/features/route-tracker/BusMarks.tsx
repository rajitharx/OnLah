import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon, WheelchairIcon } from '../../shared/components';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { busTypeLabel } from '../../shared/utils/busType';
import type { TrackedBus } from '../../types/domain';
import { deckTypeOf } from './trackerLabels';

// The small facts about one bus: how it is tracked, its deck, and wheelchair access. Each has text for screen readers.
export function BusMarks({ bus }: { bus: TrackedBus }): React.JSX.Element {
  return (
    <View style={styles.row}>
      {!bus.monitored && (
        <View style={styles.mark}>
          <Icon name="clock" size={12} />
          <Text allowFontScaling={true} style={styles.text}>Scheduled</Text>
        </View>
      )}
      <View style={styles.mark}>
        <Text allowFontScaling={true} style={styles.text}>{busTypeLabel(deckTypeOf(bus.type))}</Text>
      </View>
      {bus.feature === 'WAB' && (
        <View style={styles.mark} accessible accessibilityLabel="Wheelchair accessible">
          <WheelchairIcon size={12} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
  },
  text: {
    ...typography.caption,
  },
});
