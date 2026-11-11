import { NavigatorScreenParams } from '@react-navigation/native';

export type ArrivalsParams = {
  stopCode: string;
  stopName: string | null;
  roadName: string | null;
  // Known when the stop came from search or nearby. Saved stops look them up for Show in Maps.
  latitude?: number;
  longitude?: number;
};

// One service at one stop. Without a destination the backend picks the direction the stop is served in.
export type TrackParams = {
  stopCode: string;
  serviceNo: string;
  destinationCode?: string;
};

export type SavedStackParamList = {
  SavedList: undefined;
  Arrivals: ArrivalsParams;
  Track: TrackParams;
};

export type NearbyStackParamList = {
  NearbyList: undefined;
  Arrivals: ArrivalsParams;
  Track: TrackParams;
};

export type SearchStackParamList = {
  Search: undefined;
  Arrivals: ArrivalsParams;
  Track: TrackParams;
};

export type RootTabParamList = {
  SavedTab: NavigatorScreenParams<SavedStackParamList>;
  NearbyTab: NavigatorScreenParams<NearbyStackParamList>;
  SearchTab: NavigatorScreenParams<SearchStackParamList>;
};
