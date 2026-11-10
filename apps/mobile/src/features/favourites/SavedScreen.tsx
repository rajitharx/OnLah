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
