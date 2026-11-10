import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, minTapSize, radius, spacing, typography } from '../theme';
import { FeatherName, Icon } from './Icons';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  icon?: FeatherName;
}

// A secondary button for notices and empty states.
export function ActionButton({ label, onPress, icon }: ActionButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {icon !== undefined && <Icon name={icon} color={colors.accent} />}
      <Text allowFontScaling={true} style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: minTapSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
  },
  label: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
