import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_SAVED_BUSES } from '../src/shared/utils/limits';
import {
  addSavedBus,
  hasSavedBus,
  isSavedBusesFull,
  parseSavedBuses,
  removeSavedBus,
  type SavedBus,
} from '../src/shared/utils/savedBuses';

const bus = (stopCode: string, serviceNo: string): SavedBus => ({
  stopCode,
  serviceNo,
  stopName: `Stop ${stopCode}`,
  roadName: 'Victoria St',
  latitude: 1.29,
  longitude: 103.85,
});

test('parse returns an empty list for nothing or garbage', () => {
  assert.deepEqual(parseSavedBuses(null), { buses: [] });
  assert.deepEqual(parseSavedBuses('text'), { buses: [] });
  assert.deepEqual(parseSavedBuses({ buses: 'nope' }), { buses: [] });
});

test('parse drops entries that are not saved buses', () => {
  const buses = ['01012/12', bus('01012', '12'), { stopCode: 1, serviceNo: '12' }, null];
  assert.deepEqual(parseSavedBuses({ buses }), { buses: [bus('01012', '12')] });
});

test('parse keeps one entry when the same bus is stored twice', () => {
  const buses = [bus('01012', '12'), bus('01012', '12'), bus('01012', '14')];
  assert.deepEqual(parseSavedBuses({ buses }), { buses: [bus('01012', '12'), bus('01012', '14')] });
});

test('parse keeps at most the cap', () => {
  const buses = Array.from({ length: MAX_SAVED_BUSES + 4 }, (_, i) => bus('01012', String(i)));
  assert.equal(parseSavedBuses({ buses }).buses.length, MAX_SAVED_BUSES);
});

test('stop codes stay strings, a numeric code is invalid', () => {
  assert.deepEqual(parseSavedBuses({ buses: [{ ...bus('01012', '12'), stopCode: 1012 }] }), { buses: [] });
});

test('add appends a new bus and ignores a repeat', () => {
  const list = addSavedBus([], bus('01012', '12'));
  assert.deepEqual(list, [bus('01012', '12')]);
  assert.equal(addSavedBus(list, bus('01012', '12')), list);
});

test('the same service at another stop is a different bus', () => {
  const list = addSavedBus([bus('01012', '12')], bus('03111', '12'));
  assert.equal(list.length, 2);
  assert.ok(hasSavedBus(list, '03111', '12'));
  assert.ok(!hasSavedBus(list, '03111', '14'));
});

test('add refuses a new bus once the list is full', () => {
  const full = Array.from({ length: MAX_SAVED_BUSES }, (_, i) => bus('01012', String(i)));
  assert.ok(isSavedBusesFull(full));
  assert.equal(addSavedBus(full, bus('03111', '99')), full);
});

test('remove drops only the matching bus', () => {
  const list = [bus('01012', '12'), bus('03111', '12')];
  assert.deepEqual(removeSavedBus(list, '01012', '12'), [bus('03111', '12')]);
});
