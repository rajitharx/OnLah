import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CrowdLevel } from '../../types/domain';
import { colors, spacing, typography } from '../theme';
import { getCrowdColor, getCrowdLabel } from '../utils/crowdLevel';
import { WheelchairIcon } from './Icons';

const CROWD_LEVELS: CrowdLevel[] = [0, 1, 2];

// One StyleSheet per level, built once, so the swatch colour never needs an inline style object.
const SWATCHES = CROWD_LEVELS.map((level) => StyleSheet.create({ swatch: { backgroundColor: getCrowdColor(level) } }).swatch);

// Explains the crowd colours and the no-wheelchair-access mark on the tiles.
export function BoardLegend(): React.JSX.Element {
  return (
    <View style={styles.legend} accessibilityLabel="How to read the times">
      {CROWD_LEVELS.map((level) => (
        <View key={level} style={styles.item}>
          <View style={[styles.swatch, SWATCHES[level]]} />
          <Text allowFontScaling={true} style={styles.text}>{getCrowdLabel(level)}</Text>
        </View>
      ))}
      <View style={styles.item}>
        <WheelchairIcon size={12} crossed />
        <Text allowFontScaling={true} style={styles.text}>Not wheelchair accessible</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  swatch: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    ...typography.caption,
    color: colors.muted,
  },
});
