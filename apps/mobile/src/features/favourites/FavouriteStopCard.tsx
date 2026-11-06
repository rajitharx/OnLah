import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BusArrivalRow, SkeletonRow } from '../../shared/components';
import { useArrivals } from '../arrivals/useArrivals';
import { colors, spacing, typography } from '../../shared/theme';
import { useNow } from '../../shared/hooks/useNow';
import { buildArrivalLabel, buildFavouriteCardLabel } from '../../shared/utils/accessibility';
import { formatFreshness, isStale } from '../../shared/utils/eta';
import { FavouriteStop } from '../../shared/utils/favourites';
import { useStopDetailsBackfill } from './useFavourites';

const MAX_SERVICES_SHOWN = 3;

interface FavouriteStopCardProps {
  stop: FavouriteStop;
  onPress: () => void;
  // Each change asks this card to refetch (pull-to-refresh on the list).
  refreshSignal?: number;
  // Called once that refetch has finished, whether it worked or not.
  onRefreshed?: () => void;
}

export function FavouriteStopCard({
  stop,
  onPress,
  refreshSignal = 0,
  onRefreshed,
}: FavouriteStopCardProps): React.JSX.Element {
  const { data, isLoading, error, refresh } = useArrivals(stop.code);
  const seenSignal = useRef(refreshSignal);
  const onRefreshedRef = useRef(onRefreshed);
  onRefreshedRef.current = onRefreshed;

  useEffect(() => {
    if (refreshSignal === seenSignal.current) return;
    seenSignal.current = refreshSignal;
    refresh().finally(() => onRefreshedRef.current?.());
  }, [refreshSignal, refresh]);

  const now = useNow(data?.fetchedAt);
  useStopDetailsBackfill(stop);
  const services = data?.services.slice(0, MAX_SERVICES_SHOWN) ?? [];
  const hiddenCount = Math.max(0, (data?.services.length ?? 0) - MAX_SERVICES_SHOWN);
  const moreLabel = `+${hiddenCount} more ${hiddenCount === 1 ? 'service' : 'services'}`;
  const details = !data
    ? [isLoading ? 'Loading arrivals' : error].filter((d): d is string => d !== null)
    : services.length === 0
      ? ['No buses in service']
      : services.map((arrival) => buildArrivalLabel(arrival, now));
  if (hiddenCount > 0) details.push(moreLabel);
  if (data && error) details.push(error);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={buildFavouriteCardLabel(stop, details)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View importantForAccessibility="no-hide-descendants">
        <View style={styles.cardHeader}>
          <View>
            <Text allowFontScaling={true} style={styles.stopName}>
              {stop.name ?? `Stop ${stop.code}`}
            </Text>
            {stop.name ? (
              <Text allowFontScaling={true} style={typography.caption}>
                {stop.road ? `${stop.code} · ${stop.road}` : stop.code}
              </Text>
            ) : null}
          </View>
          <View style={styles.liveBadge}>
            <Text allowFontScaling={true} style={styles.liveText}>
              LIVE
            </Text>
          </View>
        </View>

        {isLoading && !data ? (
          <SkeletonRow />
        ) : !data ? (
          error ? (
            <Text allowFontScaling={true} style={styles.errorText}>
              {error}
            </Text>
          ) : null
        ) : data.services.length === 0 ? (
          <Text allowFontScaling={true} style={styles.noServiceText}>
            No buses in service
          </Text>
        ) : (
          <>
            {services.map((arrival, index) => (
              <View key={arrival.serviceNo}>
                {index > 0 && <View style={styles.divider} />}
                <BusArrivalRow arrival={arrival} now={now} />
              </View>
            ))}
            {hiddenCount > 0 ? (
              <Text allowFontScaling={true} style={styles.moreText}>
                {moreLabel}
              </Text>
            ) : null}
          </>
        )}

        {data && error ? (
          <Text allowFontScaling={true} style={styles.errorText}>
            {error}
          </Text>
        ) : null}

        {data && (
          <View style={styles.footer}>
            <View
              style={[styles.liveIndicator, isStale(data.fetchedAt, now) && styles.staleIndicator]}
            />
            <Text allowFontScaling={true} style={styles.freshnessText}>
              {formatFreshness(data.fetchedAt, now)}
            </Text>
          </View>
        )}
      </View>
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
  staleIndicator: {
    backgroundColor: colors.muted,
  },
  errorText: {
    ...typography.caption,
    color: colors.crowdRed,
    paddingVertical: spacing.sm,
  },
  moreText: {
    ...typography.caption,
    color: colors.muted,
    paddingTop: spacing.sm,
  },
  noServiceText: {
    ...typography.caption,
    color: colors.muted,
    paddingVertical: spacing.sm,
  },
});
