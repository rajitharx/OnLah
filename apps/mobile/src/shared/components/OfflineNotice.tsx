import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useOffline } from '../hooks/useOffline';
import { colors, radius, spacing, typography } from '../theme';
import { OFFLINE_MESSAGE } from '../utils/connectivity';
import { Icon } from './Icons';

export function OfflineBanner(): React.JSX.Element {
  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Icon name="wifi-off" size={16} color={colors.accent} />
      <Text allowFontScaling={true} style={styles.text}>{OFFLINE_MESSAGE}</Text>
    </View>
  );
}

export function OfflineNotice(): React.JSX.Element | null {
  return useOffline() ? <OfflineBanner /> : null;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
  },
  text: {
    ...typography.caption,
    color: colors.accent,
    flex: 1,
  },
});
