import assert from 'node:assert/strict';
import { test } from 'node:test';
import { busAdvisories } from '../src/features/arrivals/busAdvisories';
import { ArrivalTiming, BusArrival, BusArrivalsResponse } from '../src/types/domain';

const timing: ArrivalTiming = {
  estimatedArrival: '2026-10-17T10:05:00+08:00',
  load: 0,
  isWheelchairAccessible: false,
  type: 0,
  isMonitored: true,
  isLastBus: false,
};

const service = (serviceNo: string, nextBus: ArrivalTiming | null): BusArrival => ({
  serviceNo,
  operator: 'SBST',
  routes: [],
  nextBus,
  nextBus2: null,
  nextBus3: null,
});

const response = (services: BusArrival[]): BusArrivalsResponse => ({
  stopCode: '01012',
  fetchedAt: '2026-10-17T10:00:00Z',
  services,
});

test('returns no advisories when every service has buses due', () => {
  assert.deepEqual(busAdvisories(response([service('15', timing)])), []);
});

test('reports a stop with no services', () => {
  assert.deepEqual(busAdvisories(response([])), [
    { kind: 'stop-quiet', message: 'No bus times for this stop right now. Buses may not be running, or the data is unavailable.' },
  ]);
});

test('reports a service that has no buses due, keeping its number', () => {
  assert.deepEqual(busAdvisories(response([service('166', null)])), [
    { kind: 'service-no-buses', serviceNo: '166', message: 'Service 166 has no buses due.' },
  ]);
});

test('reports only the empty services and keeps the order of the response', () => {
  const advisories = busAdvisories(response([service('15', timing), service('166', null), service('51', null)]));
  assert.deepEqual(
    advisories.map((a) => (a.kind === 'service-no-buses' ? a.serviceNo : a.kind)),
    ['166', '51'],
  );
});

test('does not report a service that has a later bus but no next bus', () => {
  const laterOnly: BusArrival = { ...service('65', null), nextBus2: timing };
  assert.deepEqual(busAdvisories(response([laterOnly])), []);
});
