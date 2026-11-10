import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNow } from '../hooks/useNow';
import { colors, radius, spacing, typography } from '../theme';
import { STALE_TITLE, staleDetail } from '../utils/freshness';
import { ActionButton } from './ActionButton';

interface StaleNoticeProps {
  fetchedAt: string;
  onRetry: () => void;
  // Several notices can show at once, such as one per saved stop, so those use 'status' instead of interrupting.
  tone?: 'alert' | 'status';
}

export function StaleNotice({ fetchedAt, onRetry, tone = 'alert' }: StaleNoticeProps): React.JSX.Element {
  const now = useNow(fetchedAt);
  return (
    <View
      style={styles.notice}
      accessibilityRole={tone === 'alert' ? 'alert' : undefined}
      accessibilityLiveRegion={tone === 'alert' ? 'assertive' : 'polite'}
    >
      <Text allowFontScaling={true} style={styles.title}>{STALE_TITLE}</Text>
      <Text allowFontScaling={true} style={styles.detail}>{staleDetail(fetchedAt, now)}</Text>
      <ActionButton label="Try again" icon="refresh-cw" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.crowdAmber,
    borderRadius: radius.field,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    color: colors.crowdAmber,
  },
  detail: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
});
