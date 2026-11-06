import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BusArrival } from '../../types/domain';
import { colors, spacing, typography } from '../theme';
import { formatEta, formatThen } from '../utils/eta';
import { CrowdBadge } from './CrowdBadge';

interface BusArrivalRowProps {
  arrival: BusArrival;
}

export function BusArrivalRow({ arrival }: BusArrivalRowProps): React.JSX.Element {
  const { nextBus, nextBus2, nextBus3 } = arrival;
  const then = formatThen([nextBus2?.estimatedArrival ?? null, nextBus3?.estimatedArrival ?? null]);

  return (
    <View style={styles.row}>
      <View style={styles.badgeCol}>
        <View style={styles.badge}>
          <Text allowFontScaling={true} style={styles.badgeText}>
            {arrival.serviceNo}
          </Text>
        </View>
        {nextBus?.isWheelchairAccessible && (
          <Feather name="plus-circle" size={10} color={colors.muted} style={styles.wab} />
        )}
        {nextBus?.isMonitored === false && (
          <Feather name="clock" size={10} color={colors.muted} style={styles.wab} />
        )}
      </View>

      <View style={styles.etaCol}>
        {nextBus ? (
          <>
            <View style={styles.etaRow}>
              <Text allowFontScaling={true} style={styles.etaNumber}>
                {formatEta(nextBus.estimatedArrival)}
              </Text>
              <Text allowFontScaling={true} style={styles.etaUnit}>
                {formatEta(nextBus.estimatedArrival) !== 'Arr' ? ' min' : ''}
              </Text>
            </View>
            <CrowdBadge level={nextBus.load} />
          </>
        ) : (
          <Text allowFontScaling={true} style={styles.noService}>
            —
          </Text>
        )}
      </View>

      <View style={styles.eta2Col}>
        {then !== '' ? (
          <Text allowFontScaling={true} style={styles.eta2}>
            {then}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  badgeCol: {
    width: 52,
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.serviceBadge,
    color: colors.accent,
  },
  wab: {
    marginTop: spacing.xs,
  },
  etaCol: {
    flex: 1,
    paddingLeft: spacing.md,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  etaNumber: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 24,
    color: colors.white,
    letterSpacing: -0.5,
  },
  etaUnit: {
    ...typography.caption,
    color: colors.muted,
  },
  noService: {
    ...typography.body,
    color: colors.muted,
  },
  eta2Col: {
    alignItems: 'flex-end',
  },
  eta2: {
    ...typography.caption,
    color: colors.muted,
  },
});
