import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NearbyStackParamList, RootTabParamList } from '../../app/navigation/types';
import { ActionButton, EmptyState, OfflineNotice, SkeletonTiles, StopCard } from '../../shared/components';
import { useLocation } from '../../shared/hooks/useLocation';
import { colors, spacing, typography } from '../../shared/theme';
import { BusStop } from '../../types/domain';
import { locationFailureMessage } from './locationMessages';
import { NEARBY_RADIUS_KM } from './nearbyModel';
import { useNearbyStops } from './useNearbyStops';

type Props = CompositeScreenProps<
  NativeStackScreenProps<NearbyStackParamList, 'NearbyList'>,
  BottomTabScreenProps<RootTabParamList>
>;

function StopSeparator(): React.JSX.Element {
  return <View style={styles.separator} />;
}

export function NearbyScreen({ navigation }: Props): React.JSX.Element {
  const { origin, locating, failure, locate } = useLocation();
  const [attempt, setAttempt] = useState(0);
  const { stops, loading, failed } = useNearbyStops(origin, attempt);

  function openSearch(): void {
    navigation.navigate('SearchTab', { screen: 'Search' });
  }

  function handleOpen(stop: BusStop): void {
    navigation.navigate('Arrivals', {
      stopCode: stop.busStopCode,
      stopName: stop.description,
      roadName: stop.roadName,
      latitude: stop.latitude,
      longitude: stop.longitude,
    });
  }

  function handleLocate(): void {
    void locate().then(() => setAttempt((n) => n + 1));
  }

  const searchAction = <ActionButton label="Search stops" icon="search" onPress={openSearch} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={stops}
        keyExtractor={(item) => item.busStopCode}
        renderItem={({ item }) => (
          <StopCard stop={item} distanceMeters={item.distanceMeters} onOpen={handleOpen} />
        )}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={StopSeparator}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text allowFontScaling={true} accessibilityRole="header" style={styles.title}>Nearby stops</Text>
            <OfflineNotice />
            <View style={styles.actions}>
              <ActionButton
                label={locating ? 'Locating…' : 'Use my location'}
                icon="map-pin"
                onPress={handleLocate}
              />
              {origin !== null && (
                <Text allowFontScaling={true} style={typography.caption}>
                  Stops within {NEARBY_RADIUS_KM} km of you
                </Text>
              )}
            </View>
            {origin === null && (
              <Text allowFontScaling={true} style={typography.caption}>
                Your location is used only to find stops near you. It is not saved on this phone.
              </Text>
            )}

            {failure !== null && (
              <View style={styles.retry}>
                <Text allowFontScaling={true} accessibilityRole="alert" style={styles.error}>
                  {locationFailureMessage(failure)}
                </Text>
                {searchAction}
              </View>
            )}
            {failed && (
              <View style={styles.retry}>
                <Text allowFontScaling={true} accessibilityRole="alert" style={styles.error}>
                  Nearby stops are unavailable right now. Try again.
                </Text>
                <ActionButton label="Try again" icon="refresh-cw" onPress={() => setAttempt((n) => n + 1)} />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          origin === null ? (
            <EmptyState icon="map-pin" message="Nearby stops appear once you share your location." />
          ) : loading ? (
            <SkeletonTiles label="Finding nearby stops" />
          ) : !failed ? (
            <EmptyState
              icon="map-pin"
              message={`No stops within ${NEARBY_RADIUS_KM} km. Try Search instead.`}
              action={searchAction}
            />
          ) : null
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
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  retry: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  error: {
    ...typography.caption,
    color: colors.crowdRed,
  },
  separator: {
    height: spacing.sm,
  },
});
