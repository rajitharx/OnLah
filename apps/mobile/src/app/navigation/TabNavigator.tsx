import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrivalScreen } from '../../features/arrivals/ArrivalScreen';
import { FavouritesScreen } from '../../features/favourites/FavouritesScreen';
import { NearbyScreen } from '../../features/nearby/NearbyScreen';
import { SearchScreen } from '../../features/search/SearchScreen';
import { useDisruptions } from '../../features/disruptions/useDisruptions';
import { colors, spacing, typography } from '../../shared/theme';
import {
  HomeStackParamList,
  NearbyStackParamList,
  RootTabParamList,
  SearchStackParamList,
} from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const NearbyStack = createNativeStackNavigator<NearbyStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();

function HomeNavigator(): React.JSX.Element {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Favourites" component={FavouritesScreen} />
      <HomeStack.Screen name="Arrivals" component={ArrivalScreen} />
    </HomeStack.Navigator>
  );
}

function NearbyNavigator(): React.JSX.Element {
  return (
    <NearbyStack.Navigator screenOptions={{ headerShown: false }}>
      <NearbyStack.Screen name="NearbyList" component={NearbyScreen} />
      <NearbyStack.Screen name="Arrivals" component={ArrivalScreen} />
    </NearbyStack.Navigator>
  );
}

function SearchNavigator(): React.JSX.Element {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="Search" component={SearchScreen} />
      <SearchStack.Screen name="Arrivals" component={ArrivalScreen} />
    </SearchStack.Navigator>
  );
}

export function TabNavigator(): React.JSX.Element {
  useDisruptions();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
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
            HomeTab: 'home',
            NearbyTab: 'compass',
            SearchTab: 'search',
          };
          return <Feather name={icons[route.name] ?? 'circle'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="NearbyTab" component={NearbyNavigator} options={{ title: 'Nearby' }} />
      <Tab.Screen name="SearchTab" component={SearchNavigator} options={{ title: 'Search' }} />
    </Tab.Navigator>
  );
}
