import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BusArrivalRow } from '../../shared/components';
import { useArrivals } from '../arrivals/useArrivals';
import { colors, spacing, typography } from '../../shared/theme';
import { formatFreshness } from '../../shared/utils/eta';

interface FavouriteStopCardProps {
  stopCode: string;
  onPress: () => void;
  // Each change asks this card to refetch (pull-to-refresh on the list).
  refreshSignal?: number;
  // Called once that refetch has finished, whether it worked or not.
  onRefreshed?: () => void;
}

export function FavouriteStopCard({
  stopCode,
  onPress,
  refreshSignal = 0,
  onRefreshed,
}: FavouriteStopCardProps): React.JSX.Element {
  const { data, isLoading, error, refresh } = useArrivals(stopCode);
  const seenSignal = useRef(refreshSignal);
  const onRefreshedRef = useRef(onRefreshed);
  onRefreshedRef.current = onRefreshed;

  useEffect(() => {
    if (refreshSignal === seenSignal.current) return;
    seenSignal.current = refreshSignal;
    refresh().finally(() => onRefreshedRef.current?.());
  }, [refreshSignal, refresh]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text allowFontScaling={true} style={styles.stopName}>
            Stop {stopCode}
          </Text>
        </View>
        <View style={styles.liveBadge}>
          <Text allowFontScaling={true} style={styles.liveText}>
            LIVE
          </Text>
        </View>
      </View>

      {isLoading && !data ? (
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonBadge} />
          <View style={styles.skeletonLines}>
            <View style={[styles.skeletonLine, { width: '60%' }]} />
            <View style={[styles.skeletonLine, { width: '40%', marginTop: spacing.xs }]} />
          </View>
        </View>
      ) : error ? (
        <Text allowFontScaling={true} style={styles.errorText}>
          {error}
        </Text>
      ) : data?.services.length === 0 ? (
        <Text allowFontScaling={true} style={styles.noServiceText}>
          No buses in service
        </Text>
      ) : (
        data?.services.slice(0, 3).map((arrival, index) => (
          <View key={arrival.serviceNo}>
            {index > 0 && <View style={styles.divider} />}
            <BusArrivalRow arrival={arrival} />
          </View>
        ))
      )}

      {data && (
        <View style={styles.footer}>
          <View style={styles.liveIndicator} />
          <Text allowFontScaling={true} style={styles.freshnessText}>
            {formatFreshness(data.fetchedAt)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stopName: {
    ...typography.stopName,
    marginBottom: spacing.xs,
  },
  liveBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: spacing.xl,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.crowdGreen,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  freshnessText: {
    ...typography.caption,
    color: colors.accent,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.crowdGreen,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  skeletonBadge: {
    width: 44,
    height: 44,
    borderRadius: spacing.sm,
    backgroundColor: colors.border,
  },
  skeletonLines: {
    flex: 1,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: colors.border,
    borderRadius: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.crowdRed,
    paddingVertical: spacing.sm,
  },
  noServiceText: {
    ...typography.caption,
    color: colors.muted,
    paddingVertical: spacing.sm,
  },
});
