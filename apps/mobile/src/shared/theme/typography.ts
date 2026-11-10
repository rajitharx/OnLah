import { TextStyle } from 'react-native';
import { colors } from './colors';

export const typography = {
  etaNumber: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 28,
    color: colors.white,
  } as TextStyle,
  // Screen title on Saved, Nearby and Search.
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  } as TextStyle,
  // Stop name at the top of the arrivals screen.
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  } as TextStyle,
  // The minutes in a compact arrival row. The large tile uses etaNumber.
  etaNumberCompact: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 24,
    color: colors.white,
    letterSpacing: -0.5,
  } as TextStyle,
  // Bus stop code in a search result.
  stopCode: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13,
    color: colors.accent,
  } as TextStyle,
  // Small status label inside a pill, such as LIVE.
  badge: {
    fontSize: 10,
    fontWeight: '700',
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
