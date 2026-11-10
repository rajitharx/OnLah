import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NEARBY_RADIUS_M, nearbyStopsSorted } from '../src/features/nearby/nearbyModel';
import type { BusStop } from '../src/types/domain';

const stop = (code: string, distanceMeters: number): BusStop => ({
  busStopCode: code, roadName: 'Rd', description: code, latitude: 0, longitude: 0, distanceMeters,
});

test('nearby looks within 1 km', () => {
  assert.equal(NEARBY_RADIUS_M, 1_000);
});

test('nearbyStopsSorted puts the closest first without touching the input', () => {
  const input = [stop('b', 400), stop('a', 90), stop('c', 900)];
  assert.deepEqual(nearbyStopsSorted(input).map((s) => s.busStopCode), ['a', 'b', 'c']);
  assert.deepEqual(input.map((s) => s.busStopCode), ['b', 'a', 'c']);
});
