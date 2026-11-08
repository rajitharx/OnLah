import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BusArrival } from '../../types/domain';
import { colors, minTapSize, spacing, typography } from '../theme';
import { buildArrivalLabel } from '../utils/accessibility';
import { formatEta, formatThen } from '../utils/eta';
import { CrowdBadge } from './CrowdBadge';

interface BusArrivalRowProps {
  arrival: BusArrival;
  now: number;
}

export function BusArrivalRow({ arrival, now }: BusArrivalRowProps): React.JSX.Element {
  const { nextBus, nextBus2, nextBus3 } = arrival;
  const then = formatThen(
    [nextBus2?.estimatedArrival ?? null, nextBus3?.estimatedArrival ?? null],
    now,
  );

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
    minWidth: minTapSize + spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    minWidth: minTapSize,
    minHeight: minTapSize,
    paddingHorizontal: spacing.xs,
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
    ...typography.etaNumberCompact,
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
