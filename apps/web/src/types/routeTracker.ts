// Response shape of GET /api/v1/route-tracker. Plain strings and numbers only, so the mobile app can reuse it as is.
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
