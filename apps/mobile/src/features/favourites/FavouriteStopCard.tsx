import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BusArrivalRow, SkeletonRow } from '../../shared/components';
import { useArrivals } from '../arrivals/useArrivals';
import { colors, spacing, typography } from '../../shared/theme';
import { formatFreshness } from '../../shared/utils/eta';

interface FavouriteStopCardProps {
  stopCode: string;
  onPress: () => void;
}

export function FavouriteStopCard({
  stopCode,
  onPress,
}: FavouriteStopCardProps): React.JSX.Element {
  const { data, isLoading, error } = useArrivals(stopCode);

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
        <SkeletonRow />
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
