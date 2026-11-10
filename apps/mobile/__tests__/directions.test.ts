import assert from 'node:assert/strict';
import { test } from 'node:test';
import { groupByDirection, trackDestination } from '../src/features/arrivals/directions';
import { ArrivalTiming, BusArrival } from '../src/types/domain';

const timing = (minute: number, destinationCode?: string): ArrivalTiming => ({
  estimatedArrival: `2026-10-17T10:${String(minute).padStart(2, '0')}:00+08:00`,
  load: 0,
  isWheelchairAccessible: true,
  type: 0,
  isMonitored: true,
  isLastBus: false,
  destinationCode,
});

const toA = { origin: 'B', destination: 'A', destinationCode: '11111' };
const toB = { origin: 'A', destination: 'B', destinationCode: '22222' };

const service = (
  routes: BusArrival['routes'],
  nextBus: ArrivalTiming | null,
  nextBus2: ArrivalTiming | null,
  nextBus3: ArrivalTiming | null,
): BusArrival => ({ serviceNo: '136', operator: 'GAS', routes, nextBus, nextBus2, nextBus3 });

test('splits a service that stops here in both directions into one group per direction', () => {
  const first = timing(5, '11111');
  const second = timing(9, '22222');
  const third = timing(12, '11111');

  const groups = groupByDirection(service([toA, toB], first, second, third));

  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].routes, [toA]);
  assert.deepEqual(groups[0].timings, [first, third, null]);
  assert.deepEqual(groups[1].routes, [toB]);
  assert.deepEqual(groups[1].timings, [second, null, null]);
});

test('keeps a direction with no bus due as a group of empty tiles', () => {
  const groups = groupByDirection(service([toA, toB], timing(5, '11111'), null, null));
  assert.deepEqual(groups[1].timings, [null, null, null]);
});

test('keeps one group when the service has a single direction', () => {
  const bus = timing(5, '11111');
  assert.deepEqual(groupByDirection(service([toA], bus, null, null)), [{ routes: [toA], timings: [bus, null, null] }]);
});

test('keeps one group when a bus cannot be matched to a direction', () => {
  const matched = timing(5, '11111');
  const unknown = timing(9);
  assert.deepEqual(groupByDirection(service([toA, toB], matched, unknown, null)), [
    { routes: [toA, toB], timings: [matched, unknown, null] },
  ]);
});

test('trackDestination uses the only direction the row shows', () => {
  assert.equal(trackDestination(service([toB], null, null, null)), '22222');
});

test('trackDestination falls back to the first bus when the row shows several directions', () => {
  assert.equal(trackDestination(service([toA, toB], timing(5, '22222'), null, null)), '22222');
});

test('trackDestination is empty when nothing says where the bus is heading', () => {
  assert.equal(trackDestination(service([toA, toB], timing(5), null, null)), null);
});
