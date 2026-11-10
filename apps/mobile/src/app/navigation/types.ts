import { NavigatorScreenParams } from '@react-navigation/native';

export type ArrivalsParams = {
  stopCode: string;
  stopName: string | null;
  roadName: string | null;
  // Known when the stop came from search or nearby. Saved stops look them up for Show in Maps.
  latitude?: number;
  longitude?: number;
};

export type HomeStackParamList = {
  Favourites: undefined;
  Arrivals: ArrivalsParams;
};

export type NearbyStackParamList = {
  NearbyList: undefined;
  Arrivals: ArrivalsParams;
};

export type SearchStackParamList = {
  Search: undefined;
  Arrivals: ArrivalsParams;
};

export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  NearbyTab: NavigatorScreenParams<NearbyStackParamList>;
  SearchTab: NavigatorScreenParams<SearchStackParamList>;
};
