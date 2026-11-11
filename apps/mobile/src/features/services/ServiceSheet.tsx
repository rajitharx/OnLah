import React, { useMemo } from 'react';
import { Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BusArrival, ServiceDirection, StopReference } from '../../types/domain';
import { colors, minTapSize, radius, spacing, typography, withAlpha } from '../../shared/theme';
import { operatorName } from '../../shared/utils/operators';
import { collectDeckTypes, frequencyRows, hoursRows, summarizeDeckTypes } from './serviceDetails';
import { isSwipeDismiss } from './sheetGesture';
import { useBusServiceDetails } from './useBusServiceDetails';

interface ServiceSheetProps {
  visible: boolean;
  serviceNo: string;
  // The live row for this service at the stop, used for the deck types of buses due now.
  service: BusArrival | null;
  onClose: () => void;
}

// A bottom sheet for one bus service, opened from the service number on the board. The system back button and a
// swipe down on the header both close it. Details load only while it is open.
export function ServiceSheet({ visible, serviceNo, service, onClose }: ServiceSheetProps): React.JSX.Element {
  const { details, loading, failed } = useBusServiceDetails(visible ? serviceNo : null);
  const deckSummary = summarizeDeckTypes(collectDeckTypes(service));

  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderRelease: (_event, gesture) => {
          if (isSwipeDismiss(0, gesture.dy)) onClose();
        },
      }),
    [onClose],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable
          style={styles.dismissArea}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close bus details"
        />
        <View style={styles.sheet} accessibilityViewIsModal>
          <View {...swipe.panHandlers} style={styles.head}>
            <View style={styles.handle} />
            <View style={styles.headRow}>
              <View style={styles.titleRow}>
                <View style={styles.badge}>
                  <Text allowFontScaling={true} style={styles.badgeText}>{serviceNo}</Text>
                </View>
                <Text allowFontScaling={true} accessibilityRole="header" style={styles.title}>
                  Service details
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close bus details"
                style={({ pressed }) => [styles.close, pressed && styles.pressed]}
              >
                <Text allowFontScaling={true} style={styles.closeText}>Close</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {loading && (
              <Text allowFontScaling={true} accessibilityLiveRegion="polite" style={typography.caption}>
                Loading bus details…
              </Text>
            )}
            {failed && (
              <Text allowFontScaling={true} accessibilityRole="alert" style={styles.error}>
                Bus details are not available right now.
              </Text>
            )}
            {details && (
              <>
                <Text allowFontScaling={true} style={styles.meta}>
                  {details.operators.map(operatorName).join(', ')}
                  {' · '}Deck (buses due now): {deckSummary}
                </Text>
                {details.directions.map((direction) => (
                  <DirectionBlock key={direction.direction} direction={direction} />
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DirectionBlock({ direction }: { direction: ServiceDirection }): React.JSX.Element {
  const hours = hoursRows(direction.hours);
  const frequency = frequencyRows(direction.frequency);

  return (
    <View style={styles.block}>
      <Text allowFontScaling={true} style={styles.label}>
        {direction.isLoop ? 'Loop route' : `Direction ${direction.direction}`}
      </Text>
      <Text allowFontScaling={true} style={styles.route}>{routeText(direction)}</Text>
      <Text allowFontScaling={true} style={typography.caption}>
        {direction.stopCount} stops · {direction.category.toLowerCase()} service
      </Text>
      {hours.map((row) => (
        <DetailRow key={row.label} label={row.label} value={row.value} />
      ))}
      {frequency.length > 0 && <Text allowFontScaling={true} style={styles.label}>Weekday frequency</Text>}
      {frequency.map((row) => (
        <DetailRow key={row.label} label={row.label} value={row.value} />
      ))}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={styles.detailRow} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text allowFontScaling={true} style={typography.caption}>{label}</Text>
      <Text allowFontScaling={true} style={styles.value}>{value}</Text>
    </View>
  );
}

function routeText(direction: ServiceDirection): string {
  if (direction.isLoop) {
    return `Loops from ${stopName(direction.origin)}${direction.loopDescription ? ` via ${direction.loopDescription}` : ''}`;
  }
  return `${stopName(direction.origin)} to ${stopName(direction.destination)}`;
}

function stopName(stop: StopReference | null): string {
  return stop === null ? 'unknown stop' : stop.description;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: withAlpha(colors.background, 0.7),
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.field,
    borderTopRightRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.border,
  },
  head: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: spacing.xxl,
    height: spacing.xs,
    borderRadius: spacing.xs,
    backgroundColor: colors.border,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
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
  title: {
    ...typography.heading,
  },
  close: {
    minHeight: minTapSize,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  closeText: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.md,
  },
  meta: {
    ...typography.body,
  },
  error: {
    ...typography.caption,
    color: colors.crowdRed,
  },
  block: {
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  route: {
    ...typography.body,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  value: {
    ...typography.body,
  },
});
