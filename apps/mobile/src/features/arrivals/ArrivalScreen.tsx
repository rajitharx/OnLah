import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NearbyStackParamList } from '../../app/navigation/types';
import {
  BoardLegend,
  Freshness,
  Icon,
  OfflineNotice,
  ResyncButton,
  SkeletonTiles,
  StaleNotice,
} from '../../shared/components';
import { useNow } from '../../shared/hooks/useNow';
import { useFavouritesStore } from '../../shared/stores/favouritesStore';
import { colors, minTapSize, radius, spacing, typography } from '../../shared/theme';
import { MAX_FAVOURITES } from '../../shared/utils/limits';
import { mapsUrl } from '../../shared/utils/maps';
import { sortByServiceNo } from '../../shared/utils/serviceNo';
import { BusArrival, BusStop } from '../../types/domain';
import { busAdvisories } from './busAdvisories';
import { trackDestination } from './directions';
import { ServiceRow } from './ServiceRow';
import { useArrivals } from './useArrivals';
import { useStopDetails } from './useStopDetails';

type Props = NativeStackScreenProps<NearbyStackParamList, 'Arrivals'>;

function ServiceSeparator(): React.JSX.Element {
  return <View style={styles.separator} />;
}

function knownStop({ stopCode, stopName, roadName, latitude, longitude }: Props['route']['params']): BusStop | null {
  if (latitude === undefined || longitude === undefined) return null;
  return {
    busStopCode: stopCode,
    description: stopName ?? `Stop ${stopCode}`,
    roadName: roadName ?? '',
    latitude,
    longitude,
    distanceMeters: 0,
  };
}

export function ArrivalScreen({ route, navigation }: Props): React.JSX.Element {
  const { stopCode, stopName, roadName } = route.params;
  const arrivals = useArrivals(stopCode);
  const { data, failed, refresh } = arrivals;
  const details = useStopDetails(stopCode, knownStop(route.params));
  const { favourites, add, remove } = useFavouritesStore();
  const isFavourite = favourites.some((f) => f.code === stopCode);
  const saveDisabled = !isFavourite && favourites.length >= MAX_FAVOURITES;
  const now = useNow(data?.fetchedAt);

  const name = stopName ?? details?.description ?? null;
  const road = roadName ?? details?.roadName ?? null;

  function toggleFavourite(): void {
    if (isFavourite) remove(stopCode);
    else add({ code: stopCode, name, road });
  }

  function openMaps(): void {
    if (details === null) return;
    void Linking.openURL(mapsUrl(details.latitude, details.longitude)).catch(() => undefined);
  }

  const services: BusArrival[] = data ? sortByServiceNo(data.services) : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={services}
        keyExtractor={(service) => `${service.serviceNo}:${trackDestination(service) ?? ''}`}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ServiceSeparator}
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}
              hitSlop={spacing.md}
            >
              <Icon name="chevron-left" size={22} color={colors.accent} />
              <Text allowFontScaling={true} style={styles.backLabel}>Back</Text>
            </Pressable>

            <OfflineNotice />

            <View style={styles.titleRow}>
              <View style={styles.title}>
                <Text allowFontScaling={true} style={styles.code}>{stopCode}</Text>
                <Text allowFontScaling={true} accessibilityRole="header" style={styles.name}>
                  {name ?? `Stop ${stopCode}`}
                </Text>
                {road !== null && (
                  <View style={styles.inline}>
                    <Icon name="map-pin" size={14} />
                    <Text allowFontScaling={true} style={typography.caption}>{road}</Text>
                  </View>
                )}
                {details !== null && (
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel="Show in Maps"
                    onPress={openMaps}
                    hitSlop={spacing.sm}
                    style={({ pressed }) => [styles.inline, pressed && styles.pressed]}
                  >
                    <Icon name="map" size={14} color={colors.accent} />
                    <Text allowFontScaling={true} style={styles.link}>Show in Maps</Text>
                  </Pressable>
                )}
              </View>
              <Pressable
                onPress={toggleFavourite}
                disabled={saveDisabled}
                accessibilityRole="button"
                accessibilityLabel={isFavourite ? 'Remove stop from saved stops' : 'Save stop'}
                accessibilityState={{ selected: isFavourite, disabled: saveDisabled }}
                style={({ pressed }) => [styles.saveBtn, (pressed || saveDisabled) && styles.pressed]}
              >
                <Icon name="star" size={14} color={isFavourite ? colors.accent : colors.muted} />
                <Text allowFontScaling={true} style={styles.saveLabel}>
                  {isFavourite ? 'Saved stop' : 'Save stop'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.meta}>
              {data && !failed && <Freshness fetchedAt={data.fetchedAt} />}
              <Text allowFontScaling={true} style={typography.caption}>LTA DataMall · every 20s</Text>
              <ResyncButton label="Refresh bus times" onPress={refresh} />
            </View>
            {saveDisabled && (
              <Text allowFontScaling={true} style={typography.caption}>
                Saved stops are full ({MAX_FAVOURITES})
              </Text>
            )}

            {failed && data && <StaleNotice fetchedAt={data.fetchedAt} onRetry={refresh} />}
            {failed && !data && (
              <Text allowFontScaling={true} accessibilityRole="alert" style={styles.error}>
                Bus times are unavailable right now. Retrying every 20 seconds.
              </Text>
            )}
            {!data && !failed && <SkeletonTiles label="Loading bus times" />}

            {data &&
              busAdvisories(data).map((advisory) => (
                <Text
                  allowFontScaling={true}
                  accessibilityLiveRegion="polite"
                  style={styles.advisory}
                  key={advisory.kind === 'service-no-buses' ? advisory.serviceNo : advisory.kind}
                >
                  {advisory.message}
                </Text>
              ))}

            {services.length > 0 && (
              <View style={styles.legend}>
                <Text allowFontScaling={true} style={styles.label}>Next departures · minutes</Text>
                <BoardLegend />
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => <ServiceRow service={item} now={now} />}
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
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  backLabel: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  title: {
    flex: 1,
    gap: spacing.xs,
  },
  code: {
    ...typography.stopCode,
  },
  name: {
    ...typography.heading,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  link: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  saveBtn: {
    minHeight: minTapSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
  },
  saveLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.crowdRed,
  },
  advisory: {
    ...typography.caption,
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.crowdRed,
    backgroundColor: colors.surface,
  },
  legend: {
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  separator: {
    height: spacing.sm,
  },
});
