import assert from 'node:assert/strict';
import { test } from 'node:test';
import { groupByStop, hasBusesDue, pickSavedServices, savedBusesCaption, toBusStop } from '../src/features/saved-buses/savedBusView';
import type { BusArrival, BusArrivalsResponse } from '../src/types/domain';
import type { SavedBus } from '../src/shared/utils/savedBuses';

const bus = (stopCode: string, serviceNo: string): SavedBus => ({
  stopCode,
  serviceNo,
  stopName: `Stop ${stopCode}`,
  roadName: 'Victoria St',
  latitude: 1.29,
  longitude: 103.85,
});

const service = (serviceNo: string, due = false): BusArrival => ({
  serviceNo,
  operator: 'SBST',
  routes: [],
  nextBus: due
    ? { estimatedArrival: '2026-10-19T10:05:00Z', load: 0, isWheelchairAccessible: true, type: 0, isMonitored: true, isLastBus: false }
    : null,
  nextBus2: null,
  nextBus3: null,
});

const arrivals = (services: BusArrival[]): BusArrivalsResponse => ({
  stopCode: '01012',
  fetchedAt: '2026-10-19T10:00:00Z',
  services,
});

test('groups services under their stop in first-saved order', () => {
  const groups = groupByStop([bus('03111', '12'), bus('01012', '14'), bus('03111', '2')]);
  assert.deepEqual(
    groups.map((g) => [g.stopCode, g.serviceNos]),
    [
      ['03111', ['12', '2']],
      ['01012', ['14']],
    ],
  );
  assert.equal(groups[0].stopName, 'Stop 03111');
});

test('no saved buses give no groups', () => {
  assert.deepEqual(groupByStop([]), []);
});

test('toBusStop rebuilds the stop a group was saved from', () => {
  const [group] = groupByStop([bus('03111', '12')]);
  assert.deepEqual(toBusStop(group), {
    busStopCode: '03111',
    description: 'Stop 03111',
    roadName: 'Victoria St',
    latitude: 1.29,
    longitude: 103.85,
    distanceMeters: 0,
  });
});

test('pickSavedServices pairs each saved number with its row, or null', () => {
  const rows = pickSavedServices(arrivals([service('12'), service('99')]), ['12', '14']);
  assert.equal(rows[0].service?.serviceNo, '12');
  assert.deepEqual(rows[1], { serviceNo: '14', service: null });
});

test('pickSavedServices before the first load returns null rows', () => {
  assert.deepEqual(pickSavedServices(null, ['12']), [{ serviceNo: '12', service: null }]);
});

test('hasBusesDue is true only when a bus is expected', () => {
  assert.equal(hasBusesDue(null), false);
  assert.equal(hasBusesDue(service('12')), false);
  assert.equal(hasBusesDue(service('12', true)), true);
});

test('caption appears only near the cap', () => {
  assert.equal(savedBusesCaption(3), null);
  assert.equal(savedBusesCaption(15), '15 of 20 buses saved on this device');
});
