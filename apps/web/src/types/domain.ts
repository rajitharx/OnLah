// Copied from apps/mobile/src/types/domain.ts so the web app uses the same response shapes.
// C# enum serialization: integers by default
// CrowdLevel: 0=SeatsAvailable, 1=StandingAvailable, 2=LimitedStanding
// BusType: 0=SingleDeck, 1=DoubleDeck, 2=Bendy
// TrainServiceStatus: 0=Normal, 1=Disrupted

export type CrowdLevel = 0 | 1 | 2;
export type BusType = 0 | 1 | 2;
export type TrainServiceStatus = 0 | 1;

export interface ArrivalTiming {
  estimatedArrival: string;
  load: CrowdLevel;
  isWheelchairAccessible: boolean;
  type: BusType;
  isMonitored: boolean;
  isLastBus: boolean;
  // The stop this bus is heading to. Absent when LTA does not say.
  destinationCode?: string;
}

export interface ArrivalRoute {
  origin: string;
  destination: string;
  // Matches ArrivalTiming.destinationCode of the buses running this direction.
  destinationCode: string;
}

export interface BusArrival {
  serviceNo: string;
  operator: string;
  nextBus: ArrivalTiming | null;
  nextBus2: ArrivalTiming | null;
  nextBus3: ArrivalTiming | null;
  // One entry per direction that calls at the stop. Empty when the route data is unavailable.
  routes: ArrivalRoute[];
}

export interface BusArrivalsResponse {
  stopCode: string;
  fetchedAt: string;
  services: BusArrival[];
}

export interface BusStop {
  busStopCode: string;
  roadName: string;
  description: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
}

export interface TrainAlertDetail {
  line: string;
  direction: string;
  stations: string[];
  message: string;
  createdAt: string;
}

export interface TrainAlertsData {
  status: TrainServiceStatus;
  alerts: TrainAlertDetail[];
}

export interface TrainAlertsResponse {
  data: TrainAlertsData;
  fetchedAt: string;
}
