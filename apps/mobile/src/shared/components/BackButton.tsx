import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, minTapSize, spacing, typography } from '../theme';
import { Icon } from './Icons';

interface BackButtonProps {
  onPress: () => void;
  // Spoken name. Defaults to Back, and a modal can say what it closes.
  label?: string;
}

// The one Back control, so every screen gets the same minimum tap size.
export function BackButton({ onPress, label = 'Back' }: BackButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      hitSlop={spacing.md}
    >
      <Icon name="chevron-left" size={22} color={colors.accent} />
      <Text allowFontScaling={true} style={styles.label}>Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: {
    minHeight: minTapSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
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
