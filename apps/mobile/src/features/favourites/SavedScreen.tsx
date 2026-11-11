import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SavedStackParamList, RootTabParamList } from '../../app/navigation/types';
import { colors, radius, spacing, typography } from '../../shared/theme';
import { getGreeting } from '../../shared/utils/greeting';
import { FavouriteStop } from '../../shared/utils/favourites';
import { EmptyState, FindStopActions } from '../../shared/components';
import { useSavedBusesStore } from '../../shared/stores/savedBusesStore';
import type { BusStop } from '../../types/domain';
import { SavedStopCard } from '../saved-buses/SavedStopCard';
import { groupByStop, savedBusesCaption } from '../saved-buses/savedBusView';
import { useSavedArrivals } from '../saved-buses/useSavedArrivals';
import { FavouriteStopCard } from './FavouriteStopCard';
import { savedStopsCaption } from './savedTab';
import { useFavourites } from './useFavourites';

type Props = CompositeScreenProps<
  NativeStackScreenProps<SavedStackParamList, 'SavedList'>,
  BottomTabScreenProps<RootTabParamList>
>;

export function SavedScreen({ navigation }: Props): React.JSX.Element {
  const { favourites } = useFavourites();
  const count = favourites.length;
  const caption = savedStopsCaption(count);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pending = useRef(0);
  const buses = useSavedBusesStore((state) => state.buses);
  const removeBus = useSavedBusesStore((state) => state.remove);
  const groups = groupByStop(buses);
  const { states, resync } = useSavedArrivals(groups.map((group) => group.stopCode));
  const busesCaption = savedBusesCaption(buses.length);
  const allFailed = groups.length > 0 && groups.every((group) => states[group.stopCode]?.failed === true);

  // Pull-to-refresh refetches every card, and stops spinning once the last one answers.
  const handleRefresh = useCallback(() => {
    if (count === 0) return;
    pending.current = count;
    setIsRefreshing(true);
    setRefreshSignal((n) => n + 1);
  }, [count]);

  // A card added or removed mid-refresh would leave the count off, so start over.
  useEffect(() => {
    pending.current = 0;
    setIsRefreshing(false);
  }, [count]);

  const handleCardRefreshed = useCallback(() => {
    pending.current = Math.max(0, pending.current - 1);
    if (pending.current === 0) setIsRefreshing(false);
  }, []);

  function handleStopPress(stop: FavouriteStop): void {
    navigation.navigate('Arrivals', {
      stopCode: stop.code,
      stopName: stop.name,
      roadName: stop.road,
    });
  }

  function handleOpenStop(stop: BusStop): void {
    navigation.navigate('Arrivals', {
      stopCode: stop.busStopCode,
      stopName: stop.description,
      roadName: stop.roadName,
      latitude: stop.latitude,
      longitude: stop.longitude,
    });
  }

  function handleNavigate(view: 'search' | 'nearby'): void {
    if (view === 'search') navigation.navigate('SearchTab', { screen: 'Search' });
    else navigation.navigate('NearbyTab', { screen: 'NearbyList' });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={favourites}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.surface}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text allowFontScaling={true} style={styles.greeting}>
                  {getGreeting()}
                </Text>
                <Text allowFontScaling={true} accessibilityRole="header" style={styles.title}>
                  Saved
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text allowFontScaling={true} accessibilityRole="header" style={styles.sectionTitle}>
                Saved buses
              </Text>
              {busesCaption !== null && (
                <Text allowFontScaling={true} style={typography.caption}>
                  {busesCaption}
                </Text>
              )}
            </View>
            {allFailed && (
              <Text allowFontScaling={true} accessibilityRole="alert" style={styles.error}>
                Couldn't load bus times for your saved stops.
              </Text>
            )}
            {groups.length === 0 ? (
              <EmptyState
                icon="star"
                message="No saved buses yet. Open a stop and tap the star next to a bus."
                action={<FindStopActions onNavigate={handleNavigate} />}
              />
            ) : (
              groups.map((group) => (
                <SavedStopCard
                  key={group.stopCode}
                  group={group}
                  state={states[group.stopCode]}
                  onOpenStop={handleOpenStop}
                  onRemoveBus={removeBus}
                  onResync={resync}
                />
              ))
            )}

            <View style={styles.sectionHeader}>
              <Text allowFontScaling={true} accessibilityRole="header" style={styles.sectionTitle}>
                Saved stops
              </Text>
              {caption !== null && (
                <Text allowFontScaling={true} style={typography.caption}>
                  {caption}
                </Text>
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <FavouriteStopCard
            stop={item}
            onPress={() => handleStopPress(item)}
            refreshSignal={refreshSignal}
            onRefreshed={handleCardRefreshed}
          />
        )}
        ItemSeparatorComponent={null}
        ListEmptyComponent={
          <EmptyState
            icon="star"
            message="No saved stops yet. Open a stop and tap Save stop."
            action={
              <FindStopActions
                onNavigate={(view) =>
                  view === 'search'
                    ? navigation.navigate('SearchTab', { screen: 'Search' })
                    : navigation.navigate('NearbyTab', { screen: 'NearbyList' })
                }
              />
            }
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
  },
  pressed: {
    opacity: 0.7,
  },
  error: {
    ...typography.caption,
    color: colors.crowdRed,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.stopName,
    letterSpacing: -0.2,
  },
});
