import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BusStop } from '../../types/domain';
import { colors, minTapSize, radius, spacing, typography } from '../theme';
import { formatDistance } from '../utils/eta';
import { highlightParts } from '../utils/highlight';

interface StopCardProps {
  stop: BusStop;
  distanceMeters?: number;
  onOpen: (stop: BusStop) => void;
  // Sits inside the same card, at the right edge, for example the saved-stop star.
  action?: React.ReactNode;
  // The search term, bolded wherever it appears in the stop's name.
  highlight?: string;
}

// A stop row. The main area opens the board.
export function StopCard({ stop, distanceMeters, onOpen, action, highlight = '' }: StopCardProps): React.JSX.Element {
  const road = distanceMeters === undefined ? stop.roadName : `${stop.roadName} · ${formatDistance(distanceMeters)}`;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${stop.description}, stop ${stop.busStopCode}, ${road}`}
        onPress={() => onOpen(stop)}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <Text allowFontScaling={true} style={styles.code}>{stop.busStopCode}</Text>
        <View style={styles.text}>
          <Text allowFontScaling={true} style={styles.name}>
            {highlightParts(stop.description, highlight).map((part, index) => (
              <Text key={index} style={part.match ? styles.match : undefined}>{part.text}</Text>
            ))}
          </Text>
          <Text allowFontScaling={true} style={styles.road}>{road}</Text>
        </View>
      </Pressable>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
  },
  main: {
    flex: 1,
    minHeight: minTapSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  code: {
    ...typography.stopCode,
  },
  name: {
    ...typography.stopName,
  },
  match: {
    color: colors.accent,
    fontWeight: '800',
  },
  road: {
    ...typography.caption,
  },
  pressed: {
    opacity: 0.7,
  },
});
