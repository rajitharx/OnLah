import { NavigatorScreenParams } from '@react-navigation/native';

export type ArrivalsParams = {
  stopCode: string;
  stopName: string;
  roadName: string;
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
