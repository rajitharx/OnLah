import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createOnlahApi } from '../src/shared/services/onlahApi';
import type {
  BusArrivalsResponse,
  BusServiceDetails,
  BusStop,
  RouteTracker,
  TrainAlertsResponse,
} from '../src/types/domain';
import busArrivals from './contract/bus-arrivals.json';
import busService from './contract/bus-service.json';
import busStopsNearby from './contract/bus-stops-nearby.json';
import busStopsSearch from './contract/bus-stops-search.json';
import routeTracker from './contract/route-tracker.json';
import routeTrackerWithDestination from './contract/route-tracker-with-destination.json';
import trainAlerts from './contract/train-alerts.json';

// Contract between the mobile app and the C# backend. The fixtures are produced by the real API in
// apps/backend/tests/OnLah.IntegrationTests/Endpoints/MobileContractTests.cs, which fails when a response changes.
// This file checks that the app's types accept those responses and that its client sends the same requests.
//
// A JSON import has plain string, number and boolean types, so the domain types are widened before the compile-time
// check. The values of the union types (crowd level, tracker status and so on) are checked at run time below.
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? Widen<U>[]
        : T extends object
          ? { [K in keyof T]: Widen<T[K]> }
          : T;

// These assignments are the check. A missing field, a field of another type, or a null where the app does not allow
// one is a typecheck error in `npm run typecheck` and `npm test`.
const arrivalsResponse: Widen<BusArrivalsResponse> = busArrivals.response;
const nearbyResponse: Widen<BusStop[]> = busStopsNearby.response;
const searchResponse: Widen<BusStop[]> = busStopsSearch.response;
const alertsResponse: Widen<TrainAlertsResponse> = trainAlerts.response;
const serviceResponse: Widen<BusServiceDetails> = busService.response;
const trackerResponse: Widen<RouteTracker> = routeTracker.response;
const trackerWithDestinationResponse: Widen<RouteTracker> = routeTrackerWithDestination.response;

function recordedUrl(call: (api: ReturnType<typeof createOnlahApi>) => Promise<unknown>): Promise<string> {
  let url = '';
  const api = createOnlahApi({
    get: async <T,>(path: string): Promise<T> => {
      url = path;
      return {} as T;
    },
    health: async () => ({ ok: true, ms: 1 }),
  });
  return call(api).then(() => url);
}

test('the client builds the request each contract fixture was recorded with', async () => {
  assert.equal(await recordedUrl((api) => api.getArrivals('83140')), busArrivals.request);
  assert.equal(await recordedUrl((api) => api.getNearbyStops(1.305, 103.8, 500)), busStopsNearby.request);
  assert.equal(await recordedUrl((api) => api.searchBusStops('Terminus')), busStopsSearch.request);
  assert.equal(await recordedUrl((api) => api.getTrainAlerts()), trainAlerts.request);
  assert.equal(await recordedUrl((api) => api.getBusService('TRK1')), busService.request);
  assert.equal(await recordedUrl((api) => api.getRouteTracker('90003', 'TRK1')), routeTracker.request);
  assert.equal(
    await recordedUrl((api) => api.getRouteTracker('90003', 'TRK1', '90003')),
    routeTrackerWithDestination.request,
  );
});

test('the fixtures exercise the optional and nullable fields the app handles', () => {
  const [first] = arrivalsResponse.services;
  assert.ok(first.nextBus?.destinationCode, 'a bus with a destination code');
  assert.equal(first.nextBus3, null, 'a missing third bus is null');
  assert.ok(first.routes.length > 0, 'a service with routes');
  const [live, other] = trackerResponse.buses;
  assert.equal(live.feature, 'WAB');
  assert.equal(other.feature, null);
  assert.equal(other.stopsAway, null);
  assert.equal(other.nearestStopCode, null);
  assert.ok(nearbyResponse.length > 0 && searchResponse.length > 0 && alertsResponse.data.alerts.length > 0);
  assert.ok(serviceResponse.directions.length > 0 && trackerWithDestinationResponse.stops.length > 0);
});

test('enum-like values are ones the app knows', () => {
  const timings = arrivalsResponse.services.flatMap((s) => [s.nextBus, s.nextBus2, s.nextBus3]).flatMap((t) => (t ? [t] : []));
  for (const t of timings) {
    assert.ok([0, 1, 2].includes(t.load), `crowd level ${t.load}`);
    assert.ok([0, 1, 2].includes(t.type), `bus type ${t.type}`);
  }
  assert.ok([0, 1].includes(alertsResponse.data.status), `train status ${alertsResponse.data.status}`);
  for (const tracker of [trackerResponse, trackerWithDestinationResponse]) {
    assert.ok(['live', 'scheduled', 'noEstimate', 'notInOperation'].includes(tracker.status), tracker.status);
    for (const bus of tracker.buses) {
      assert.ok(['SEA', 'SDA', 'LSD'].includes(bus.load), bus.load);
      assert.ok(['SD', 'DD', 'BD'].includes(bus.type), bus.type);
    }
  }
});

test('every stop code in a fixture is a string with its leading zeros intact', () => {
  const codes = [
    arrivalsResponse.stopCode,
    ...nearbyResponse.map((s) => s.busStopCode),
    ...searchResponse.map((s) => s.busStopCode),
    ...trackerResponse.stops.map((s) => s.busStopCode),
  ];
  for (const code of codes) {
    assert.match(code, /^\d{5}$/);
  }
});
