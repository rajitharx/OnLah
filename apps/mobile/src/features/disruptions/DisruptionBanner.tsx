import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDisruptionStore } from '../../shared/stores/disruptionStore';
import { colors, spacing, typography } from '../../shared/theme';

export function DisruptionBanner(): React.JSX.Element | null {
  const { status, alerts, dismissedAt, dismiss } = useDisruptionStore();

  const isDisrupted = status === 1;
  const isDismissed =
    dismissedAt !== null && alerts.length > 0;

  if (!isDisrupted || isDismissed) return null;

  const firstAlert = alerts[0];

  return (
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
  pressed: {
    opacity: 0.7,
  },
});
