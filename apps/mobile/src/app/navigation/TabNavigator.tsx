import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ArrivalScreen } from '../../features/arrivals/ArrivalScreen';
import { FavouritesScreen } from '../../features/favourites/FavouritesScreen';
import { NearbyScreen } from '../../features/nearby/NearbyScreen';
import { colors, spacing } from '../../shared/theme';
import {
  HomeStackParamList,
  NearbyStackParamList,
  RootTabParamList,
  SearchStackParamList,
} from './types';
import { Text, View, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const NearbyStack = createNativeStackNavigator<NearbyStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();

function SearchPlaceholder(): React.JSX.Element {
  return (
    <View style={placeholderStyles.container}>
      <Feather name="search" size={32} color={colors.muted} />
      <Text style={placeholderStyles.text}>Search coming soon</Text>
    </View>
  );
}

const placeholderStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  text: {
    fontSize: 14,
    color: colors.muted,
  },
});

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
      <SearchStack.Screen name="Search" component={SearchPlaceholder} />
    </SearchStack.Navigator>
  );
}

export function TabNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: spacing.xs,
          paddingTop: spacing.xs,
          height: 60,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 10,
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
