import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CrowdLevel } from '../../types/domain';
import { spacing, typography } from '../theme';
import { getCrowdColor, getCrowdLabel } from '../utils/crowdLevel';

interface CrowdBadgeProps {
  level: CrowdLevel;
}

export function CrowdBadge({ level }: CrowdBadgeProps): React.JSX.Element {
  const color = getCrowdColor(level);
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text allowFontScaling={true} style={[styles.label, { color }]}>
        {getCrowdLabel(level)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
});
