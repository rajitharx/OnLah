import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { formatEta } from '../utils/eta';

interface ETADisplayProps {
  estimatedArrival: string;
  size?: 'large' | 'small';
}

export function ETADisplay({
  estimatedArrival,
  size = 'large',
}: ETADisplayProps): React.JSX.Element {
  const label = formatEta(estimatedArrival);
  const isArr = label === 'Arr';

  if (size === 'large') {
    return (
      <View style={styles.largeRow}>
        <Text allowFontScaling={true} style={styles.largeNumber}>
          {isArr ? label : label}
        </Text>
        {!isArr && (
          <Text allowFontScaling={true} style={styles.largeUnit}>
            min
          </Text>
        )}
      </View>
    );
  }

  return (
    <Text allowFontScaling={true} style={styles.small}>
      {isArr ? 'Arr' : `${label} min`}
    </Text>
  );
}

const styles = StyleSheet.create({
  largeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  largeNumber: {
    ...typography.etaNumber,
  },
  largeUnit: {
    ...typography.caption,
    color: colors.muted,
  },
  small: {
    ...typography.caption,
    color: colors.muted,
  },
});
