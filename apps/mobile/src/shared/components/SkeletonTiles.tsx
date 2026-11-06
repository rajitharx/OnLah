import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../theme';

// One grey placeholder row in the shape of a bus row: a badge and two text lines.
export function SkeletonRow(): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.badge} />
      <View style={styles.lines}>
        <View style={styles.lineLong} />
        <View style={styles.lineShort} />
      </View>
    </View>
  );
}

interface SkeletonTilesProps {
  // Number of placeholder cards.
  count?: number;
  // Spoken to screen readers while the real content loads.
  label: string;
}

// Placeholder cards that hold the place of a list while it loads, so the screen does not jump.
export function SkeletonTiles({ count = 3, label }: SkeletonTilesProps): React.JSX.Element {
  return (
    <View
      accessible={true}
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      style={styles.list}
    >
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.card}>
          <SkeletonRow />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: spacing.sm,
    backgroundColor: colors.border,
  },
  lines: {
    flex: 1,
  },
  lineLong: {
    height: 14,
    width: '60%',
    backgroundColor: colors.border,
    borderRadius: spacing.xs,
  },
  lineShort: {
    height: 14,
    width: '40%',
    marginTop: spacing.xs,
    backgroundColor: colors.border,
    borderRadius: spacing.xs,
  },
});
