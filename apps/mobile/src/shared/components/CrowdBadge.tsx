import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CrowdLevel } from '../../types/domain';
import { spacing, typography } from '../theme';
import { getCrowdColor, getCrowdLabel } from '../utils/crowdLevel';

interface CrowdBadgeProps {
  level: CrowdLevel;
}

// One StyleSheet per level, built once, so the colour never needs an inline style object.
function toneStyles(level: CrowdLevel) {
  const color = getCrowdColor(level);
  return StyleSheet.create({ dot: { backgroundColor: color }, label: { color } });
}
const TONES: Record<CrowdLevel, ReturnType<typeof toneStyles>> = { 0: toneStyles(0), 1: toneStyles(1), 2: toneStyles(2) };

export function CrowdBadge({ level }: CrowdBadgeProps): React.JSX.Element {
  const tone = TONES[level];
  return (
    <View style={styles.row}>
      <View style={[styles.dot, tone.dot]} />
      <Text allowFontScaling={true} style={[styles.label, tone.label]}>
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
