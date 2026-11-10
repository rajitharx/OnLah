import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { releases } from '../features/release-notes/releases';
import { useApiStatus } from '../shared/hooks/useApiStatus';
import { ApiStatus, API_STATUS_LABEL, betaLabel } from '../shared/services/apiStatus';
import { colors, spacing, typography } from '../shared/theme';

const DOT_COLOURS: Record<ApiStatus, string> = {
  checking: colors.muted,
  good: colors.crowdGreen,
  slow: colors.crowdAmber,
  down: colors.crowdRed,
};

// One StyleSheet per status, built once, so the dot colour never needs an inline style object.
const DOT_STYLES = {
  checking: StyleSheet.create({ dot: { backgroundColor: DOT_COLOURS.checking } }).dot,
  good: StyleSheet.create({ dot: { backgroundColor: DOT_COLOURS.good } }).dot,
  slow: StyleSheet.create({ dot: { backgroundColor: DOT_COLOURS.slow } }).dot,
  down: StyleSheet.create({ dot: { backgroundColor: DOT_COLOURS.down } }).dot,
};

export function AppHeader(): React.JSX.Element {
  const status = useApiStatus();
  const version = releases[0]?.version ?? '';

  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <Text allowFontScaling={true} accessibilityRole="header" style={styles.wordmark}>OnLah</Text>
        <View
          accessible={true}
          accessibilityRole="image"
          accessibilityLabel={API_STATUS_LABEL[status]}
          style={[styles.dot, DOT_STYLES[status]]}
        />
      </View>
      <Text allowFontScaling={true} style={styles.version}>{betaLabel(version)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  wordmark: {
    ...typography.stopName,
    fontWeight: '800',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  version: {
    ...typography.caption,
  },
});
