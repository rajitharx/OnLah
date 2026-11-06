import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BusArrival } from '../../types/domain';
import { colors, spacing, typography } from '../theme';
import { buildArrivalLabel } from '../utils/accessibility';
import { formatEta } from '../utils/eta';
import { CrowdBadge } from './CrowdBadge';

interface BusArrivalRowProps {
  arrival: BusArrival;
  now: number;
}

export function BusArrivalRow({ arrival, now }: BusArrivalRowProps): React.JSX.Element {
  const { nextBus, nextBus2 } = arrival;

  return (
    <View style={styles.row} accessible accessibilityLabel={buildArrivalLabel(arrival, now)}>
      <View style={styles.badgeCol}>
        <View style={styles.badge}>
          <Text allowFontScaling={true} style={styles.badgeText}>
            {arrival.serviceNo}
          </Text>
        </View>
        {nextBus?.isWheelchairAccessible && (
          <MaterialCommunityIcons
            name="wheelchair-accessibility"
            size={12}
            color={colors.muted}
            style={styles.wab}
            accessibilityLabel="Wheelchair accessible"
          />
        )}
        {nextBus?.isMonitored === false && (
          <Feather
            name="clock"
            size={10}
            color={colors.muted}
            style={styles.wab}
            accessibilityLabel="Scheduled time, not live"
          />
        )}
      </View>

      <View style={styles.etaCol}>
        {nextBus ? (
          <>
            <View style={styles.etaRow}>
              <Text allowFontScaling={true} style={styles.etaNumber}>
                {formatEta(nextBus.estimatedArrival, now)}
              </Text>
              <Text allowFontScaling={true} style={styles.etaUnit}>
                {formatEta(nextBus.estimatedArrival, now) !== 'Arr' ? ' min' : ''}
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
        {nextBus2 ? (
          <Text allowFontScaling={true} style={styles.eta2}>
            {formatEta(nextBus2.estimatedArrival, now) === 'Arr'
              ? 'then Arr'
              : `then ${formatEta(nextBus2.estimatedArrival, now)} min`}
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
    color: colors.accent,
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
    color: colors.accent,
  },
});
