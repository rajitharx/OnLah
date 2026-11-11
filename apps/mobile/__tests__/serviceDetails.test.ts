import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  collectDeckTypes,
  formatFrequency,
  formatHours,
  frequencyRows,
  hoursRows,
  summarizeDeckTypes,
} from '../src/features/services/serviceDetails';
import { isSwipeDismiss } from '../src/features/services/sheetGesture';
import type { ArrivalTiming, BusArrival } from '../src/types/domain';

const timing = (type: 0 | 1 | 2): ArrivalTiming => ({
  estimatedArrival: '2026-10-19T10:05:00Z',
  load: 0,
  isWheelchairAccessible: true,
  type,
  isMonitored: true,
  isLastBus: false,
});

test('formatHours shows a range, or says it is not published', () => {
  assert.equal(formatHours({ first: '05:30', last: '23:30' }), '05:30 to 23:30');
  assert.equal(formatHours(null), 'Not published');
});

test('formatFrequency turns ranges into plain minutes', () => {
  assert.equal(formatFrequency('09-13'), '9 to 13 min');
  assert.equal(formatFrequency('9-11'), '9 to 11 min');
  assert.equal(formatFrequency(null), 'Not published');
  assert.equal(formatFrequency('Every 10 min'), 'Every 10 min');
});

test('summarizeDeckTypes names what is seen', () => {
  assert.equal(summarizeDeckTypes([]), 'No deck type seen right now');
  assert.equal(summarizeDeckTypes([1]), 'Double deck');
  assert.equal(summarizeDeckTypes([0, 1]), 'Single deck and double deck');
  assert.equal(summarizeDeckTypes([2, 0, 1, 1]), 'Single deck, double deck and bendy');
});

test('collectDeckTypes reads the live timings of one service', () => {
  const service: BusArrival = {
    serviceNo: '12',
    operator: 'SBST',
    routes: [],
    nextBus: timing(1),
    nextBus2: timing(0),
    nextBus3: null,
  };
  assert.deepEqual(collectDeckTypes(service), [0, 1]);
  assert.deepEqual(collectDeckTypes(null), []);
});

test('hoursRows leaves out days LTA does not publish', () => {
  assert.deepEqual(
    hoursRows({ weekday: { first: '05:30', last: '23:30' }, saturday: null, sunday: { first: '06:00', last: '23:00' } }),
    [
      { label: 'Weekday', value: '05:30 to 23:30' },
      { label: 'Sunday', value: '06:00 to 23:00' },
    ],
  );
});

test('frequencyRows leaves out missing periods', () => {
  assert.deepEqual(frequencyRows({ amPeak: '09-13', amOffPeak: null, pmPeak: '7-9', pmOffPeak: null }), [
    { label: 'Morning peak', value: '9 to 13 min' },
    { label: 'Evening peak', value: '7 to 9 min' },
  ]);
});

test('a clear downward swipe closes the sheet, a tap or upward swipe does not', () => {
  assert.equal(isSwipeDismiss(100, 200), true);
  assert.equal(isSwipeDismiss(100, 120), false);
  assert.equal(isSwipeDismiss(200, 100), false);
});
