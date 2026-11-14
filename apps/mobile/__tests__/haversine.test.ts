import assert from 'node:assert/strict';
import { test } from 'node:test';
import { haversineMeters, sortByDistance } from '../src/shared/utils/haversine';

test('the distance from a point to itself is zero', () => {
  assert.equal(haversineMeters(1.3521, 103.8198, 1.3521, 103.8198), 0);
});

test('one degree of latitude is about 111 km', () => {
  const metres = haversineMeters(1, 103.8, 2, 103.8);
  assert.ok(Math.abs(metres - 111_195) < 100, `got ${metres}`);
});

test('the distance is the same in both directions', () => {
  const there = haversineMeters(1.3, 103.8, 1.4, 103.9);
  const back = haversineMeters(1.4, 103.9, 1.3, 103.8);
  assert.equal(there, back);
});

test('sortByDistance puts the nearest first and leaves the input alone', () => {
  const stops = [{ id: 'far', distanceMeters: 900 }, { id: 'near', distanceMeters: 40 }, { id: 'mid', distanceMeters: 300 }];
  const sorted = sortByDistance(stops);
  assert.deepEqual(sorted.map((s) => s.id), ['near', 'mid', 'far']);
  assert.deepEqual(stops.map((s) => s.id), ['far', 'near', 'mid']);
});
