import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNow } from '../hooks/useNow';
import { colors, spacing, typography } from '../theme';
import { freshnessText } from '../utils/freshness';

interface FreshnessProps {
  fetchedAt: string;
  // A stale chip says so in words, so the state never rests on colour alone.
  stale?: boolean;
}

// Shows how old the data is. It replaces a loading spinner on silent refresh.
export function Freshness({ fetchedAt, stale = false }: FreshnessProps): React.JSX.Element {
  const now = useNow(fetchedAt);
  return (
    <View style={styles.row}>
      <View style={[styles.dot, stale ? styles.dotStale : styles.dotLive]} />
      <Text allowFontScaling={true} style={[styles.text, stale && styles.textStale]}>
        {freshnessText(fetchedAt, now, stale)}
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
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotLive: {
    backgroundColor: colors.crowdGreen,
  },
  dotStale: {
    backgroundColor: colors.crowdAmber,
  },
  text: {
    ...typography.caption,
  },
  textStale: {
    color: colors.crowdAmber,
  },
});
