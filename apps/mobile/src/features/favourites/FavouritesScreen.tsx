import { Feather } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeStackParamList, RootTabParamList } from '../../app/navigation/types';
import { colors, spacing, typography } from '../../shared/theme';
import { DisruptionBanner } from '../disruptions/DisruptionBanner';
import { useDisruptions } from '../disruptions/useDisruptions';
import { FavouriteStopCard } from './FavouriteStopCard';
import { useFavourites } from './useFavourites';

type Props = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, 'Favourites'>,
  BottomTabScreenProps<RootTabParamList>
>;

export function FavouritesScreen({ navigation }: Props): React.JSX.Element {
  useDisruptions();
  const { stopCodes } = useFavourites();
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pending = useRef(0);

  // Pull-to-refresh refetches every card, and stops spinning once the last one answers.
  const handleRefresh = useCallback(() => {
    if (stopCodes.length === 0) return;
    pending.current = stopCodes.length;
    setIsRefreshing(true);
    setRefreshSignal((n) => n + 1);
  }, [stopCodes.length]);

  // A card added or removed mid-refresh would leave the count off, so start over.
  useEffect(() => {
    pending.current = 0;
    setIsRefreshing(false);
  }, [stopCodes.length]);

  const handleCardRefreshed = useCallback(() => {
    pending.current = Math.max(0, pending.current - 1);
    if (pending.current === 0) setIsRefreshing(false);
  }, []);

  function handleStopPress(stopCode: string): void {
    navigation.navigate('Arrivals', { stopCode, stopName: stopCode, roadName: '' });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={stopCodes}
        keyExtractor={(item) => item}
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
                  Good morning
                </Text>
                <Text allowFontScaling={true} style={styles.title}>
                  OnLah
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                hitSlop={spacing.sm}
              >
                <Feather name="bell" size={18} color={colors.muted} />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.searchBar, pressed && styles.pressed]}
              onPress={() => navigation.navigate('SearchTab', { screen: 'Search' })}
            >
              <Feather name="search" size={16} color={colors.muted} />
              <Text allowFontScaling={true} style={styles.searchPlaceholder}>
                Search stops, bus numbers…
              </Text>
            </Pressable>

            <DisruptionBanner />

            <View style={styles.sectionHeader}>
              <Text allowFontScaling={true} style={styles.sectionTitle}>
                Your Stops
              </Text>
              <Pressable hitSlop={spacing.sm}>
                <Text allowFontScaling={true} style={styles.editLabel}>
                  Edit
                </Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <FavouriteStopCard
            stopCode={item}
            onPress={() => handleStopPress(item)}
            refreshSignal={refreshSignal}
            onRefreshed={handleCardRefreshed}
          />
        )}
        ItemSeparatorComponent={null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="star" size={32} color={colors.muted} />
            <Text allowFontScaling={true} style={styles.emptyText}>
              Add a stop to get started
            </Text>
            <Text allowFontScaling={true} style={styles.emptyHint}>
              Tap Nearby to discover stops close to you
            </Text>
          </View>
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
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  searchBar: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchPlaceholder: {
    ...typography.body,
    color: colors.muted,
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
  editLabel: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
  },
  emptyHint: {
    ...typography.caption,
    textAlign: 'center',
  },
});
