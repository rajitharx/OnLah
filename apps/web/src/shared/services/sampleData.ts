import type {
  ArrivalTiming,
  BusArrival,
  BusArrivalsResponse,
  BusStop,
  BusType,
  CrowdLevel,
  TrainAlertsResponse,
} from '../../types/domain';

// Everything in this file is made up for the design review. Stop codes are strings.
export const SAMPLE_NOTE = 'Sample data for design review. Not live LTA data.';

export const SEED_FAVOURITES: string[] = ['01012', '03111'];

export const sampleStops: BusStop[] = [
  { busStopCode: '01012', roadName: 'Victoria St', description: 'Hotel Grand Pacific', latitude: 1.29684, longitude: 103.85312, distanceMeters: 0 },
  { busStopCode: '03111', roadName: 'Orchard Rd', description: 'Opp Ngee Ann City', latitude: 1.30405, longitude: 103.83485, distanceMeters: 0 },
  { busStopCode: '14141', roadName: 'Raffles Place', description: 'Raffles Place Stn', latitude: 1.2841, longitude: 103.8513, distanceMeters: 0 },
  { busStopCode: '05123', roadName: 'Bras Basah Rd', description: 'Bugis Junction', latitude: 1.2969, longitude: 103.856, distanceMeters: 0 },
  { busStopCode: '44131', roadName: 'Marina Blvd', description: 'Marina Bay Sands', latitude: 1.2833, longitude: 103.8608, distanceMeters: 0 },
  { busStopCode: '75009', roadName: 'Changi Village Rd', description: 'Changi Village Term', latitude: 1.3917, longitude: 103.9877, distanceMeters: 0 },
];

interface SampleBus {
  minutes: number | null;
  load: CrowdLevel;
  wheelchair: boolean;
  type: BusType;
}

interface ServiceTemplate {
  serviceNo: string;
  operator: string;
  buses: [SampleBus, SampleBus, SampleBus];
}

const serviceTemplates: ServiceTemplate[] = [
  {
    serviceNo: '15', operator: 'SBST',
    buses: [
      { minutes: 2, load: 0, wheelchair: true, type: 1 },
      { minutes: 9, load: 0, wheelchair: true, type: 1 },
      { minutes: 17, load: 1, wheelchair: false, type: 0 },
    ],
  },
  {
    serviceNo: '51', operator: 'SBST',
    buses: [
      { minutes: 4, load: 1, wheelchair: true, type: 0 },
      { minutes: 11, load: 2, wheelchair: true, type: 0 },
      { minutes: null, load: 0, wheelchair: false, type: 0 },
    ],
  },
  {
    serviceNo: '65', operator: 'SBST',
    buses: [
      { minutes: 1, load: 2, wheelchair: true, type: 1 },
      { minutes: 6, load: 2, wheelchair: false, type: 1 },
      { minutes: 13, load: 0, wheelchair: true, type: 0 },
    ],
  },
  {
    serviceNo: '107', operator: 'TIBS',
    buses: [
      { minutes: 0, load: 1, wheelchair: true, type: 0 },
      { minutes: 8, load: 0, wheelchair: true, type: 2 },
      { minutes: 19, load: 1, wheelchair: true, type: 0 },
    ],
  },
  {
    serviceNo: '961', operator: 'SMRT',
    buses: [
      { minutes: 6, load: 0, wheelchair: true, type: 2 },
      { minutes: 18, load: 1, wheelchair: true, type: 2 },
      { minutes: 30, load: 0, wheelchair: false, type: 2 },
    ],
  },
  {
    serviceNo: '166', operator: 'TIBS',
    buses: [
      { minutes: null, load: 0, wheelchair: false, type: 0 },
      { minutes: null, load: 0, wheelchair: false, type: 0 },
      { minutes: null, load: 0, wheelchair: false, type: 0 },
    ],
  },
];

function toTiming(bus: SampleBus, now: number, shift: number): ArrivalTiming | null {
  if (bus.minutes === null) return null;
  return {
    estimatedArrival: new Date(now + (bus.minutes + shift) * 60_000).toISOString(),
    load: bus.load,
    isWheelchairAccessible: bus.wheelchair,
    type: bus.type,
    isMonitored: true,
  };
}

// Builds a BusArrivalsResponse shaped like GET /api/v1/bus-arrivals/{stopCode}.
// The last digit of the stop code shifts the sample ETAs so each stop looks different.
export function makeSampleArrivals(stopCode: string, now: number): BusArrivalsResponse {
  const shift = stopCode.charCodeAt(stopCode.length - 1) % 4;
  const services: BusArrival[] = serviceTemplates.map((t) => ({
    serviceNo: t.serviceNo,
    operator: t.operator,
    nextBus: toTiming(t.buses[0], now, shift),
    nextBus2: toTiming(t.buses[1], now, shift),
    nextBus3: toTiming(t.buses[2], now, shift),
  }));
  return { stopCode, fetchedAt: new Date(now).toISOString(), services };
}

// Builds a TrainAlertsResponse with one disruption (status 1 = Disrupted).
export function makeSampleTrainAlerts(now: number): TrainAlertsResponse {
  return {
    data: {
      status: 1,
      alerts: [
        {
          line: 'North South Line',
          direction: 'Towards Marina South Pier',
          stations: ['Raffles Place', 'Marina Bay'],
          message: 'Train service is delayed between Raffles Place and Marina Bay. Shuttle buses are running.',
          createdAt: new Date(now - 12 * 60_000).toISOString(),
        },
      ],
    },
    fetchedAt: new Date(now).toISOString(),
  };
}
