import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BusArrivalRow } from '../../shared/components';
import { useArrivals } from '../arrivals/useArrivals';
import { colors, spacing, typography } from '../../shared/theme';
import { formatFreshness } from '../../shared/utils/eta';

const MAX_SERVICES_SHOWN = 3;

interface FavouriteStopCardProps {
  stopCode: string;
  onPress: () => void;
}

export function FavouriteStopCard({
  stopCode,
  onPress,
}: FavouriteStopCardProps): React.JSX.Element {
  const { data, isLoading, error } = useArrivals(stopCode);

  const hiddenCount = Math.max(0, (data?.services.length ?? 0) - MAX_SERVICES_SHOWN);

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
        <>
          {data?.services.slice(0, MAX_SERVICES_SHOWN).map((arrival, index) => (
            <View key={arrival.serviceNo}>
              {index > 0 && <View style={styles.divider} />}
              <BusArrivalRow arrival={arrival} />
            </View>
          ))}
          {hiddenCount > 0 ? (
            <Text allowFontScaling={true} style={styles.moreText}>
              +{hiddenCount} more {hiddenCount === 1 ? 'service' : 'services'}
            </Text>
          ) : null}
        </>
      )}

      {data && (
        <View style={styles.footer}>
          <View style={styles.liveIndicator} />
          <Text allowFontScaling={true} style={typography.caption}>
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
