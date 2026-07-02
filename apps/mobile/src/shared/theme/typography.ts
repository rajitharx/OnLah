import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  etaNumber: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 28,
    color: colors.white,
  } as TextStyle,
  stopName: {
    fontWeight: '600',
    fontSize: 16,
    color: colors.white,
  } as TextStyle,
  serviceBadge: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 14,
    color: colors.accent,
  } as TextStyle,
  body: {
    fontSize: 14,
    color: colors.white,
  } as TextStyle,
  caption: {
    fontSize: 12,
    color: colors.muted,
  } as TextStyle,
} as const;
