import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BusArrivalRow } from '../../shared/components';
import { useFavouritesStore } from '../../shared/stores/favouritesStore';
import { colors, spacing, typography } from '../../shared/theme';
import { buildFavouriteLabel } from '../../shared/utils/accessibility';
import { formatFreshness } from '../../shared/utils/eta';
import { BusArrival } from '../../types/domain';
import { NearbyStackParamList } from '../../app/navigation/types';
import { useArrivals } from './useArrivals';

type Props = NativeStackScreenProps<NearbyStackParamList, 'Arrivals'>;

export function ArrivalScreen({ route, navigation }: Props): React.JSX.Element {
  const { stopCode, stopName, roadName } = route.params;
  const { data, isLoading, error, refresh } = useArrivals(stopCode);
  const { isFavourite, add, remove } = useFavouritesStore();
  const fav = isFavourite(stopCode);

  function toggleFavourite(): void {
    fav ? remove(stopCode) : add(stopCode);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            hitSlop={spacing.md}
          >
            <Feather name="chevron-left" size={22} color={colors.accent} />
            <Text allowFontScaling={true} style={styles.backLabel}>
              Back
            </Text>
          </Pressable>
          <Pressable
            onPress={toggleFavourite}
            accessibilityRole="button"
            accessibilityLabel={buildFavouriteLabel(fav)}
            accessibilityState={{ selected: fav }}
            style={({ pressed }) => [styles.favBtn, pressed && styles.pressed]}
            hitSlop={spacing.md}
          >
            <Feather
              name="star"
              size={20}
              color={fav ? colors.accent : colors.muted}
            />
          </Pressable>
        </View>

        <View style={styles.stopHeader}>
          <Text allowFontScaling={true} style={styles.stopName}>
            {stopName}
          </Text>
          <View style={styles.stopMeta}>
            <Text allowFontScaling={true} style={typography.caption}>
              Stop {stopCode}
            </Text>
            {roadName ? (
              <>
                <View style={styles.dot} />
                <Text allowFontScaling={true} style={typography.caption}>
                  {roadName}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        <View style={styles.freshnessRow}>
          {data ? (
            <View style={styles.freshnessLeft}>
              <View style={styles.liveIndicator} />
              <Text allowFontScaling={true} style={typography.caption}>
                {formatFreshness(data.fetchedAt)}
              </Text>
            </View>
          ) : null}
          <Pressable
            onPress={refresh}
            accessibilityRole="button"
            accessibilityLabel="Refresh arrivals"
            style={({ pressed }) => [styles.refreshBtn, pressed && styles.pressed]}
          >
            <Feather name="refresh-cw" size={12} color={colors.accent} />
            <Text allowFontScaling={true} style={styles.refreshLabel}>
              Refresh
            </Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        {isLoading && !data ? (
          <View style={styles.skeleton}>
            <ActivityIndicator color={colors.muted} />
          </View>
        ) : error ? (
          <Text allowFontScaling={true} style={styles.errorText}>
            {error}
          </Text>
        ) : data?.services.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="moon" size={28} color={colors.muted} />
            <Text allowFontScaling={true} style={styles.emptyText}>
              No buses currently in service
            </Text>
          </View>
        ) : (
          data?.services.map((arrival: BusArrival) => (
            <View key={arrival.serviceNo} style={styles.arrivalCard}>
              <BusArrivalRow arrival={arrival} />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backLabel: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
  favBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  stopHeader: {
    marginBottom: spacing.sm,
  },
  stopName: {
    fontWeight: '800',
    fontSize: 24,
    color: colors.white,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  stopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.muted,
  },
  freshnessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  freshnessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  liveIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.crowdGreen,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.sm,
  },
  refreshLabel: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  arrivalCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  skeleton: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.caption,
    color: colors.crowdRed,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
  },
});
