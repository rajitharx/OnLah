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
  // The stop this bus is heading to. The API sends null when LTA does not say.
  destinationCode?: string | null;
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

// GET /api/v1/bus-services/{serviceNo}
export interface StopReference {
  busStopCode: string;
  description: string;
  roadName: string;
}

export interface HoursRange {
  first: string;
  last: string;
}

export interface OperatingHours {
  weekday: HoursRange | null;
  saturday: HoursRange | null;
  sunday: HoursRange | null;
}

// Minute ranges as LTA publishes them, for example "9-11". Null when LTA has no value.
export interface ServiceFrequency {
  amPeak: string | null;
  amOffPeak: string | null;
  pmPeak: string | null;
  pmOffPeak: string | null;
}

export interface ServiceDirection {
  direction: number;
  category: string;
  isLoop: boolean;
  loopDescription: string | null;
  origin: StopReference | null;
  destination: StopReference | null;
  stopCount: number;
  frequency: ServiceFrequency;
  hours: OperatingHours;
}

export interface BusServiceDetails {
  serviceNo: string;
  operators: string[];
  directions: ServiceDirection[];
}

// GET /api/v1/route-tracker
export type TrackerStatus = 'live' | 'scheduled' | 'noEstimate' | 'notInOperation';

export interface TrackerStop {
  sequence: number;
  busStopCode: string;
  description: string;
  roadName: string;
  distanceKm: number;
}

export interface TrackedBus {
  estimatedArrival: string;
  etaMinutes: number;
  etaLabel: string;
  load: 'SEA' | 'SDA' | 'LSD';
  feature: 'WAB' | null;
  type: 'SD' | 'DD' | 'BD';
  monitored: boolean;
  stopsAway: number | null;
  nearestStopCode: string | null;
}

export interface RouteTracker {
  serviceNo: string;
  direction: number;
  status: TrackerStatus;
  fetchedAt: string;
  destination: TrackerStop;
  userStopIndex: number;
  stops: TrackerStop[];
  buses: TrackedBus[];
}
