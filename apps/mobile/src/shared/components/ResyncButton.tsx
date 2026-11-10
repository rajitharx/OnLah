import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, minTapSize } from '../theme';
import { Icon } from './Icons';

interface ResyncButtonProps {
  // Names the thing being refreshed, since the icon has no text.
  label: string;
  onPress: () => void;
}

// One control for every refresh: the stop board, saved stops and saved buses.
export function ResyncButton({ label, onPress }: ResyncButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={0}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name="refresh-cw" size={18} color={colors.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: minTapSize,
    height: minTapSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
