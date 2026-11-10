import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { AppShell } from '../AppShell';
import { TabNavigator } from './TabNavigator';

export function RootNavigator(): React.JSX.Element {
  return (
    <NavigationContainer>
      <AppShell>
        <TabNavigator />
      </AppShell>
    </NavigationContainer>
  );
}
