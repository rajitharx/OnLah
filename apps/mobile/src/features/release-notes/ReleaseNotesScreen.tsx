import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../shared/components';
import { betaLabel } from '../../shared/services/apiStatus';
import { colors, minTapSize, radius, spacing, typography } from '../../shared/theme';
import { releases, type ItemKind } from './releases';

const KIND_LABELS: Record<ItemKind, string> = { feature: 'New', improvement: 'Better', fix: 'Fixed' };

interface ReleaseNotesScreenProps {
  visible: boolean;
  onClose: () => void;
}

// The release history, opened from the version label in the header. The system back button closes it.
export function ReleaseNotesScreen({ visible, onClose }: ReleaseNotesScreenProps): React.JSX.Element {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close release notes"
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
            hitSlop={spacing.md}
          >
            <Icon name="chevron-left" size={22} color={colors.accent} />
            <Text allowFontScaling={true} style={styles.backLabel}>Back</Text>
          </Pressable>

          <Text allowFontScaling={true} accessibilityRole="header" style={styles.title}>Release notes</Text>
          <Text allowFontScaling={true} style={typography.body}>
            This build: {betaLabel(releases[0]?.version ?? '')}
          </Text>

          {releases.map((release) => (
            <View key={release.version} style={styles.release}>
              <Text allowFontScaling={true} accessibilityRole="header" style={styles.releaseTitle}>
                {release.version} · {release.title}
              </Text>
              <Text allowFontScaling={true} style={typography.caption}>{release.summary}</Text>
              {release.items.map((item) => (
                <View key={item.text} style={styles.item}>
                  <Text allowFontScaling={true} style={styles.kind}>{KIND_LABELS[item.kind]}</Text>
                  <Text allowFontScaling={true} style={styles.itemText}>{item.text}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
  title: {
    ...typography.title,
  },
  release: {
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.field,
  },
  releaseTitle: {
    ...typography.stopName,
  },
  item: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  kind: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
    minWidth: spacing.xl + spacing.sm,
  },
  itemText: {
    ...typography.body,
    flex: 1,
  },
});
