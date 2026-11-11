import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Freshness, Icon, ResyncButton, StaleNotice } from '../../shared/components';
import { useNow } from '../../shared/hooks/useNow';
import { colors, minTapSize, radius, spacing, typography } from '../../shared/theme';
import { SLOW_LOAD_MESSAGE, EMPTY_ARRIVALS, type ArrivalsState } from '../arrivals/arrivalsState';
import { EtaTile } from '../arrivals/EtaTile';
import { ServiceRow } from '../arrivals/ServiceRow';
import { pickSavedServices, toBusStop, type SavedStopGroup } from './savedBusView';
import type { BusStop } from '../../types/domain';

interface SavedStopCardProps {
  group: SavedStopGroup;
  state: ArrivalsState | undefined;
  onOpenStop: (stop: BusStop) => void;
  onRemoveBus: (stopCode: string, serviceNo: string) => void;
  onResync: (stopCode: string) => void;
}

const EMPTY_TIMINGS = [0, 1, 2];

// One saved stop with the saved services at it. Each service is the same row as on the board, and its star removes it.
export function SavedStopCard({ group, state, onOpenStop, onRemoveBus, onResync }: SavedStopCardProps): React.JSX.Element {
  const current = state ?? EMPTY_ARRIVALS;
  const now = useNow(current.data?.fetchedAt);
  const rows = pickSavedServices(current.data, group.serviceNos);
  const stop = toBusStop(group);

  return (
    <View style={styles.card} accessibilityLabel={`Saved buses at ${group.stopName}`}>
      <View style={styles.head}>
        <Pressable
          onPress={() => onOpenStop(stop)}
          accessibilityRole="button"
          accessibilityLabel={`Open board for ${group.stopName}, stop ${group.stopCode}`}
          style={({ pressed }) => [styles.open, pressed && styles.pressed]}
        >
          <View style={styles.title}>
            <Text allowFontScaling={true} style={styles.code}>{group.stopCode}</Text>
            <Text allowFontScaling={true} style={styles.name}>{group.stopName}</Text>
          </View>
          <Icon name="chevron-right" size={18} color={colors.accent} />
        </Pressable>
        <ResyncButton label={`Re-sync ${group.stopName}`} onPress={() => onResync(group.stopCode)} />
      </View>
      {group.roadName !== '' && <Text allowFontScaling={true} style={typography.caption}>{group.roadName}</Text>}
      {current.data !== null && !current.failed && <Freshness fetchedAt={current.data.fetchedAt} />}

      {current.data !== null && current.failed && (
        <StaleNotice fetchedAt={current.data.fetchedAt} onRetry={() => onResync(group.stopCode)} tone="status" />
      )}
      {current.data === null && current.failed && (
        <Text allowFontScaling={true} accessibilityLiveRegion="polite" style={styles.error}>
          Bus times are unavailable right now.
        </Text>
      )}
      {current.data === null && !current.failed && (
        <Text allowFontScaling={true} accessibilityLiveRegion="polite" style={typography.caption}>
          {current.slow ? SLOW_LOAD_MESSAGE : 'Loading bus times…'}
        </Text>
      )}

      {current.data !== null &&
        rows.map(({ serviceNo, service }) =>
          service ? (
            <ServiceRow
              key={serviceNo}
              service={service}
              now={now}
              isSaved
              onToggleSave={() => onRemoveBus(group.stopCode, serviceNo)}
            />
          ) : (
            // The stop returned no row for this bus: empty tiles, with the star still there to remove it.
            <View style={styles.missing} key={serviceNo}>
              <View style={styles.missingHead}>
                <Text allowFontScaling={true} style={typography.serviceBadge}>{serviceNo}</Text>
                <Pressable
                  onPress={() => onRemoveBus(group.stopCode, serviceNo)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove bus ${serviceNo} from saved buses`}
                  style={styles.star}
                >
                  <Icon name="star" size={16} color={colors.accent} />
                </Pressable>
              </View>
              <View style={styles.tiles}>
                {EMPTY_TIMINGS.map((slot) => (
                  <EtaTile key={slot} timing={null} now={now} />
                ))}
              </View>
            </View>
          ),
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  open: {
    flex: 1,
    minHeight: minTapSize,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    flex: 1,
    gap: spacing.xs,
  },
  code: {
    ...typography.stopCode,
  },
  name: {
    ...typography.stopName,
  },
  error: {
    ...typography.caption,
    color: colors.crowdRed,
  },
  missing: {
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
  },
  missingHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  star: {
    width: minTapSize,
    height: minTapSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
