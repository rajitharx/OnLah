import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, minTapSize, spacing, typography } from '../../shared/theme';
import { formatDistance } from '../../shared/utils/eta';
import { BusStop } from '../../types/domain';
import { NearbyStackParamList } from '../../app/navigation/types';
import { useNearbyStops } from './useNearbyStops';

type Props = NativeStackScreenProps<NearbyStackParamList, 'NearbyList'>;

function StopSeparator(): React.JSX.Element {
  return <View style={styles.separator} />;
}

export function NearbyScreen({ navigation }: Props): React.JSX.Element {
  const { stops, isLoading, error, hasPermission, requestPermission } =
    useNearbyStops();

  function handleStopPress(stop: BusStop): void {
    navigation.navigate('Arrivals', {
      stopCode: stop.busStopCode,
      stopName: stop.description,
      roadName: stop.roadName,
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={stops}
        keyExtractor={(item) => item.busStopCode}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={StopSeparator}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <View style={styles.locationRow}>
                  <Feather name="map-pin" size={12} color={colors.accent} />
                  <Text allowFontScaling={true} style={styles.locationLabel}>
                    Current location
                  </Text>
                </View>
                <Text allowFontScaling={true} style={styles.title}>
                  Nearby
                </Text>
              </View>
              <View style={styles.locIcon}>
                <Feather name="navigation" size={18} color={colors.background} />
              </View>
            </View>

            {hasPermission === false ? (
              <View style={styles.permissionCard}>
                <Feather name="map-pin" size={28} color={colors.muted} />
                <Text allowFontScaling={true} style={styles.permissionText}>
                  Location access needed to find nearby stops
                </Text>
                <Pressable
                  onPress={requestPermission}
                  style={({ pressed }) => [styles.permissionBtn, pressed && styles.pressed]}
                >
                  <Text allowFontScaling={true} style={styles.permissionBtnText}>
                    Allow Location
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {stops.length > 0 && (
              <Text allowFontScaling={true} style={styles.sectionLabel}>
                Closest to you
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleStopPress(item)}
            style={({ pressed }) => [styles.stopCard, pressed && styles.pressed]}
          >
            <View style={styles.stopTop}>
              <View>
                <Text allowFontScaling={true} style={styles.stopName}>
                  {item.description}
                </Text>
                <Text allowFontScaling={true} style={typography.caption}>
                  Stop {item.busStopCode}
                </Text>
              </View>
              <View style={styles.distanceBadge}>
                <Feather name="clock" size={10} color={colors.accent} />
                <Text allowFontScaling={true} style={styles.distanceText}>
                  {formatDistance(item.distanceMeters)}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          hasPermission !== false ? (
            isLoading ? (
              <View style={styles.centred}>
                <ActivityIndicator color={colors.muted} />
                <Text allowFontScaling={true} style={styles.loadingText}>
                  Finding nearby stops…
                </Text>
              </View>
            ) : error ? (
              <View style={styles.centred}>
                <Feather name="wifi-off" size={28} color={colors.muted} />
                <Text allowFontScaling={true} style={styles.errorText}>
                  {error}
                </Text>
              </View>
            ) : hasPermission ? (
              <View style={styles.centred}>
                <Feather name="map-pin" size={28} color={colors.muted} />
                <Text allowFontScaling={true} style={styles.emptyText}>
                  No stops found within 500m
                </Text>
              </View>
            ) : null
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  locationLabel: {
    ...typography.caption,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  locIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.accent,
    borderRadius: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.body,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  stopCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  stopTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stopName: {
    ...typography.stopName,
    marginBottom: spacing.xs,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(245, 236, 215, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 236, 215, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xl,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  separator: {
    height: spacing.sm,
  },
  permissionCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  permissionText: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
  },
  permissionBtn: {
    minHeight: minTapSize,
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.md,
  },
  permissionBtnText: {
    ...typography.body,
    color: colors.background,
    fontWeight: '700',
  },
  centred: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.muted,
  },
  errorText: {
    ...typography.caption,
    color: colors.crowdRed,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
  },
});
