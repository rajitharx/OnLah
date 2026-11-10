import { Feather, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { colors } from '../theme';

export type FeatherName = keyof typeof Feather.glyphMap;

interface IconProps {
  size?: number;
  color?: string;
}

const DEFAULT_SIZE = 16;

// The app's icon set is Feather. Names are checked against the Feather glyph list.
export function Icon({ name, size = DEFAULT_SIZE, color = colors.muted }: IconProps & { name: FeatherName }): React.JSX.Element {
  return <Feather name={name} size={size} color={color} />;
}

// Feather has no wheelchair, so the one this app needs comes from Material Icons. Crossed means not accessible.
export function WheelchairIcon({ size = DEFAULT_SIZE, color = colors.muted, crossed = false }: IconProps & { crossed?: boolean }): React.JSX.Element {
  return <MaterialIcons name={crossed ? 'not-accessible' : 'accessible'} size={size} color={color} />;
}
