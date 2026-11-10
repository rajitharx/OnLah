import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { FeatherName, Icon } from './Icons';

interface EmptyStateProps {
  icon: FeatherName;
  message: string;
  // A next step, such as a button to the screen that fills the list.
  action?: React.ReactNode;
}

// Always shown in place of an empty list, never a blank area.
export function EmptyState({ icon, message, action }: EmptyStateProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Icon name={icon} size={32} color={colors.muted} />
      <Text allowFontScaling={true} style={styles.text}>{message}</Text>
      {action !== undefined && <View style={styles.actions}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  text: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
