import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Freshness, Icon } from '../../shared/components';
import { colors, minTapSize, spacing, typography } from '../../shared/theme';
import type { RouteTracker } from '../../types/domain';

interface TrackerHeaderProps {
  tracker: RouteTracker;
  stale: boolean;
  showAge: boolean;
}

export function TrackerHeader({ tracker, stale, showAge }: TrackerHeaderProps): React.JSX.Element {
  const userStop = tracker.stops[tracker.userStopIndex];

  return (
    <View style={styles.head}>
      <View style={styles.badge}>
        <Text allowFontScaling={true} style={styles.badgeText}>{tracker.serviceNo}</Text>
      </View>
      <View style={styles.title}>
        <Text allowFontScaling={true} accessibilityRole="header" style={styles.to}>
          To {tracker.destination.description}
        </Text>
        {userStop !== undefined && (
          <View style={styles.stop}>
            <Icon name="map-pin" size={14} />
            <Text allowFontScaling={true} style={typography.caption}>
              {userStop.description} · {userStop.busStopCode}
            </Text>
          </View>
        )}
        {showAge && <Freshness fetchedAt={tracker.fetchedAt} stale={stale} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  badge: {
    minWidth: minTapSize,
    minHeight: minTapSize,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    ...typography.serviceBadge,
  },
  title: {
    flex: 1,
    gap: spacing.xs,
  },
  to: {
    ...typography.heading,
  },
  stop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
