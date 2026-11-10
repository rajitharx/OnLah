import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DisruptionBanner } from '../features/disruptions/DisruptionBanner';
import { OfflineNotice } from '../shared/components/OfflineNotice';
import { colors, spacing } from '../shared/theme';
import { AppHeader } from './AppHeader';

interface AppShellProps {
  children: React.ReactNode;
}

// Everything that shows on every tab: the header with the live-data dot, the offline notice and the train disruption banner.
export function AppShell({ children }: AppShellProps): React.JSX.Element {
  return (
    <SafeAreaView style={styles.shell} edges={['top']}>
      <AppHeader />
      <View style={styles.notices}>
        <OfflineNotice />
        <DisruptionBanner />
      </View>
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  notices: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  body: {
    flex: 1,
  },
});
