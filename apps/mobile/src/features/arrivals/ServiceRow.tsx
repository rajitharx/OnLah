import React, { useCallback, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BusArrival } from '../../types/domain';
import { Icon, OperatorLogo } from '../../shared/components';
import { colors, minTapSize, radius, spacing, typography } from '../../shared/theme';
import { ServiceSheet } from '../services/ServiceSheet';
import { groupByDirection, trackDestination } from './directions';
import { EtaTile } from './EtaTile';

interface ServiceRowProps {
  service: BusArrival;
  now: number;
  isSaved?: boolean;
  // True when the bus is not saved and either the list is full or the stop's position is not known yet.
  saveDisabled?: boolean;
  onToggleSave?: () => void;
  // Opens the route tracker for this service, following the given direction when the row has one.
  onTrack?: (destinationCode: string | undefined) => void;
}

// One service at the stop: badge, operator, Track and save-bus actions, then each direction with its three tiles.
// Track opens the route tracker. The star saves or removes this bus at this stop.
export function ServiceRow({
  service,
  now,
  isSaved = false,
  saveDisabled = false,
  onToggleSave,
  onTrack,
}: ServiceRowProps): React.JSX.Element {
  const [sheetOpen, setSheetOpen] = useState(false);
  const badgeRef = useRef<View>(null);

  // Screen readers return to the service number that opened the sheet.
  const closeSheet = useCallback((): void => {
    setSheetOpen(false);
    if (badgeRef.current !== null) AccessibilityInfo.sendAccessibilityEvent(badgeRef.current, 'focus');
  }, []);

  return (
    <View style={styles.row}>
      <View style={styles.head}>
        <Pressable
          ref={badgeRef}
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Bus ${service.serviceNo} details`}
          style={({ pressed }) => [styles.badge, pressed && styles.dimmed]}
        >
          <Text allowFontScaling={true} style={styles.badgeText}>{service.serviceNo}</Text>
        </Pressable>
        <ServiceSheet visible={sheetOpen} serviceNo={service.serviceNo} service={service} onClose={closeSheet} />
        <View style={styles.operator}>
          <OperatorLogo operator={service.operator} />
        </View>
        <Pressable
          onPress={() => onTrack?.(trackDestination(service) ?? undefined)}
          disabled={onTrack === undefined}
          accessibilityRole="button"
          accessibilityLabel={`Track bus ${service.serviceNo}`}
          style={({ pressed }) => [styles.track, pressed && styles.dimmed]}
        >
          <Text allowFontScaling={true} style={styles.trackText}>Track</Text>
        </Pressable>
        <Pressable
          onPress={onToggleSave}
          disabled={saveDisabled || onToggleSave === undefined}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? `Remove bus ${service.serviceNo} from saved buses` : `Save bus ${service.serviceNo}`}
          accessibilityState={{ selected: isSaved, disabled: saveDisabled }}
          style={({ pressed }) => [styles.star, (pressed || saveDisabled) && styles.dimmed]}
        >
          <Icon name="star" size={16} color={isSaved ? colors.accent : colors.muted} />
        </Pressable>
      </View>
      {groupByDirection(service).map((group) => (
        <View style={styles.direction} key={group.routes.map((route) => route.destinationCode).join('|')}>
          {group.routes.map((route) => (
            <Text
              allowFontScaling={true}
              style={styles.route}
              key={`${route.origin}>${route.destination}`}
              accessibilityLabel={`From ${route.origin} to ${route.destination}`}
            >
              {route.origin} → {route.destination}
            </Text>
          ))}
          <View style={styles.tiles}>
            {group.timings.map((timing, index) => (
              <EtaTile key={index} timing={timing} now={now} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    padding: spacing.md,
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
  badge: {
    minWidth: minTapSize,
    minHeight: minTapSize,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    ...typography.serviceBadge,
  },
  operator: {
    flex: 1,
  },
  track: {
    minHeight: minTapSize,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  trackText: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
  star: {
    width: minTapSize,
    height: minTapSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: {
    opacity: 0.5,
  },
  direction: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  route: {
    ...typography.caption,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
