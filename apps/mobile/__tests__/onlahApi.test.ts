import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createOnlahApi } from '../src/shared/services/onlahApi';

function recorder(): { urls: string[]; api: ReturnType<typeof createOnlahApi> } {
  const urls: string[] = [];
  const api = createOnlahApi({
    get: async <T,>(path: string): Promise<T> => {
      urls.push(path);
      return {} as T;
    },
    health: async () => ({ ok: true, ms: 1 }),
  });
  return { urls, api };
}

test('arrivals use the v1 bus-arrivals path with an encoded stop code string', async () => {
  const { urls, api } = recorder();
  await api.getArrivals('01012');
  assert.deepEqual(urls, ['/api/v1/bus-arrivals?stopCode=01012']);
});

test('search encodes the query', async () => {
  const { urls, api } = recorder();
  await api.searchBusStops('Ang Mo&Kio');
  assert.deepEqual(urls, ['/api/v1/bus-stops/search?query=Ang%20Mo%26Kio']);
});

test('nearby defaults to a 500 m radius and accepts another', async () => {
  const { urls, api } = recorder();
  await api.getNearbyStops(1.3, 103.8);
  await api.getNearbyStops(1.3, 103.8, 1000);
  assert.deepEqual(urls, [
    '/api/v1/bus-stops/nearby?lat=1.3&lng=103.8&radiusMeters=500',
    '/api/v1/bus-stops/nearby?lat=1.3&lng=103.8&radiusMeters=1000',
  ]);
});

test('train alerts use the v1 path', async () => {
  const { urls, api } = recorder();
  await api.getTrainAlerts();
  assert.deepEqual(urls, ['/api/v1/train-alerts']);
});

test('bus service details encode the service number', async () => {
  const { urls, api } = recorder();
  await api.getBusService('12e');
  assert.deepEqual(urls, ['/api/v1/bus-services/12e']);
});

test('route tracker sends the stop and service, and the destination only when given', async () => {
  const { urls, api } = recorder();
  await api.getRouteTracker('01012', '12');
  await api.getRouteTracker('01012', '12', '02049');
  assert.deepEqual(urls, [
    '/api/v1/route-tracker?busStopCode=01012&serviceNo=12',
    '/api/v1/route-tracker?busStopCode=01012&serviceNo=12&destinationCode=02049',
  ]);
});

test('health is passed through to the client', async () => {
  const { api } = recorder();
  assert.deepEqual(await api.getHealth(), { ok: true, ms: 1 });
});
