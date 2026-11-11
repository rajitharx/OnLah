import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrivalScreen } from '../../features/arrivals/ArrivalScreen';
import { TrackerScreen } from '../../features/route-tracker/TrackerScreen';
import { SavedScreen } from '../../features/favourites/SavedScreen';
import { defaultTab } from '../../features/favourites/savedTab';
import { useFavouritesHydrated } from '../../features/favourites/useFavourites';
import { useFavouritesStore } from '../../shared/stores/favouritesStore';
import { NearbyScreen } from '../../features/nearby/NearbyScreen';
import { SearchScreen } from '../../features/search/SearchScreen';
import { useDisruptions } from '../../features/disruptions/useDisruptions';
import { colors, spacing, typography } from '../../shared/theme';
import {
  SavedStackParamList,
  NearbyStackParamList,
  RootTabParamList,
  SearchStackParamList,
} from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const SavedStack = createNativeStackNavigator<SavedStackParamList>();
const NearbyStack = createNativeStackNavigator<NearbyStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();

function SavedNavigator(): React.JSX.Element {
  return (
    <SavedStack.Navigator screenOptions={{ headerShown: false }}>
      <SavedStack.Screen name="SavedList" component={SavedScreen} />
      <SavedStack.Screen name="Arrivals" component={ArrivalScreen} />
      <SavedStack.Screen name="Track" component={TrackerScreen} />
    </SavedStack.Navigator>
  );
}

function NearbyNavigator(): React.JSX.Element {
  return (
    <NearbyStack.Navigator screenOptions={{ headerShown: false }}>
      <NearbyStack.Screen name="NearbyList" component={NearbyScreen} />
      <NearbyStack.Screen name="Arrivals" component={ArrivalScreen} />
      <NearbyStack.Screen name="Track" component={TrackerScreen} />
    </NearbyStack.Navigator>
  );
}

function SearchNavigator(): React.JSX.Element {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="Search" component={SearchScreen} />
      <SearchStack.Screen name="Arrivals" component={ArrivalScreen} />
      <SearchStack.Screen name="Track" component={TrackerScreen} />
    </SearchStack.Navigator>
  );
}

export function TabNavigator(): React.JSX.Element {
  useDisruptions();
  const insets = useSafeAreaInsets();
  const hydrated = useFavouritesHydrated();
  const hasSaved = useFavouritesStore((state) => state.favourites.length > 0);

  // The landing tab depends on what is saved, so wait for the saved list to load from the phone before choosing.
  if (!hydrated) return <View style={styles.loading} />;

  return (
    <Tab.Navigator
      initialRouteName={defaultTab(hasSaved)}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, spacing.xs),
          paddingTop: spacing.xs,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: typography.caption.fontSize,
          fontWeight: '600',
          marginTop: spacing.xs,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Feather.glyphMap> = {
            SavedTab: 'star',
            NearbyTab: 'compass',
            SearchTab: 'search',
          };
          return <Feather name={icons[route.name] ?? 'circle'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="SavedTab" component={SavedNavigator} options={{ title: 'Saved' }} />
      <Tab.Screen name="NearbyTab" component={NearbyNavigator} options={{ title: 'Nearby' }} />
      <Tab.Screen name="SearchTab" component={SearchNavigator} options={{ title: 'Search' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
