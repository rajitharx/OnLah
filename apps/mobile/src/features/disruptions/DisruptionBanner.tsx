import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDisruptionStore } from '../../shared/stores/disruptionStore';
import { colors, spacing, typography } from '../../shared/theme';
import { useNow } from '../../shared/hooks/useNow';
import { formatFreshness } from '../../shared/utils/eta';

export function DisruptionBanner(): React.JSX.Element | null {
  const { status, alerts, fetchedAt, hasError, dismissedAt, dismiss } = useDisruptionStore();
  const now = useNow(fetchedAt ?? undefined);

  const isDisrupted = status === 1;
  const isDismissed =
    dismissedAt !== null && alerts.length > 0;

  // A failed request is never shown as all-clear: say the alerts could not be checked, in neutral styling.
  const notice = hasError ? (
    <View style={styles.notice}>
      <Feather name="info" size={16} color={colors.accent} />
      <Text allowFontScaling={true} style={styles.noticeText}>
        Service alerts unavailable
        {fetchedAt ? ` · last checked ${formatFreshness(fetchedAt, now).replace('Updated ', '')}` : ''}
      </Text>
    </View>
  ) : null;

  if (!isDisrupted || isDismissed) return notice;

  const firstAlert = alerts[0];

  return (
    <>
    <View style={styles.banner}>
      <View style={styles.content}>
        <Feather name="alert-triangle" size={16} color={colors.crowdRed} />
        <View style={styles.textBlock}>
          <Text allowFontScaling={true} style={styles.title}>
            {firstAlert?.line ?? 'Train'} disruption
          </Text>
          {firstAlert?.message ? (
            <Text
              allowFontScaling={true}
              style={styles.message}
              numberOfLines={2}
            >
              {firstAlert.message}
            </Text>
          ) : null}
          {fetchedAt ? (
            <Text allowFontScaling={true} style={styles.updated}>
              {formatFreshness(fetchedAt, now)}
            </Text>
          ) : null}
        </View>
      </View>
      <Pressable
        onPress={dismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss disruption alert"
        hitSlop={spacing.sm}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Feather name="x" size={16} color={colors.muted} />
      </Pressable>
    </View>
    {notice}
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.crowdRed,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.body,
    color: colors.crowdRed,
    fontWeight: '700',
  },
  message: {
    ...typography.caption,
    color: colors.muted,
  },
  updated: {
    ...typography.caption,
    color: colors.accent,
  },
  notice: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  noticeText: {
    ...typography.caption,
    color: colors.accent,
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
