import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NearbyStackParamList } from '../../app/navigation/types';
import { ActionButton, EmptyState, Icon, SkeletonTiles, StaleNotice } from '../../shared/components';
import { useNow } from '../../shared/hooks/useNow';
import { colors, minTapSize, spacing, typography } from '../../shared/theme';
import { EmptyCountdown, Countdown } from './Countdown';
import { NextBusStrip } from './NextBusStrip';
import { Rail } from './Rail';
import { TrackerHeader } from './TrackerHeader';
import { buildRail } from './railModel';
import { isTrackerStale } from './trackerState';
import { useRouteTracker } from './useRouteTracker';

// Every tab stack registers the same Track screen, so any of the stacks' prop types describes it.
type Props = NativeStackScreenProps<NearbyStackParamList, 'Track'>;

// How far above the bus stop the rail scrolls to, so the stop before it stays visible.
const SCROLL_CONTEXT = spacing.xxl;

export function TrackerScreen({ route, navigation }: Props): React.JSX.Element {
  const { stopCode, serviceNo, destinationCode } = route.params;
  const { retry, ...state } = useRouteTracker(stopCode, serviceNo, destinationCode);
  const now = useNow(state.data?.fetchedAt);
  const stale = isTrackerStale(state, now);
  const scrollRef = useRef<ScrollView>(null);
  const scrollToBus = useCallback((y: number): void => {
    scrollRef.current?.scrollTo({ y: Math.max(0, y - SCROLL_CONTEXT), animated: true });
  }, []);

  const { data } = state;
  const [next, ...later] = data?.buses ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

        {state.notFound ? (
          <EmptyState icon="search" message={`Bus ${serviceNo} at stop ${stopCode} was not found.`} />
        ) : data === null ? (
          state.failed ? (
            <View style={styles.block}>
              <Text allowFontScaling={true} accessibilityRole="alert" style={styles.error}>
                The route tracker is unavailable right now.
              </Text>
              <ActionButton label="Try again" icon="refresh-cw" onPress={retry} />
            </View>
          ) : (
            <SkeletonTiles count={3} label="Loading the route" />
          )
        ) : (
          <>
            <TrackerHeader tracker={data} stale={stale} showAge={!state.failed} />
            {state.failed && <StaleNotice fetchedAt={data.fetchedAt} onRetry={retry} />}
            {next === undefined ? <EmptyCountdown status={data.status} /> : <Countdown bus={next} />}
            <NextBusStrip buses={later} />
            <Rail
              nodes={buildRail(data.stops, data.userStopIndex, next?.nearestStopCode ?? null, next?.load ?? null)}
              onFocusY={scrollToBus}
            />
          </>
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
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  back: {
    minHeight: minTapSize,
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
  block: {
    gap: spacing.md,
  },
  error: {
    ...typography.caption,
    color: colors.crowdRed,
  },
});
