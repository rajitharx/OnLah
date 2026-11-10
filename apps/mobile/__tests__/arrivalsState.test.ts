import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  EMPTY_ARRIVALS,
  SLOW_LOAD_MS,
  applyArrivalsResult,
  markSlowLoad,
  setStopState,
} from '../src/features/arrivals/arrivalsState';
import { BusArrivalsResponse } from '../src/types/domain';

const first: BusArrivalsResponse = { stopCode: '01012', fetchedAt: '2026-10-17T10:00:00Z', services: [] };
const second: BusArrivalsResponse = { stopCode: '01012', fetchedAt: '2026-10-17T10:00:20Z', services: [] };

test('the slow-load threshold is 3 seconds', () => {
  assert.equal(SLOW_LOAD_MS, 3000);
});

test('replaces data and clears the failure flag on success', () => {
  assert.deepEqual(applyArrivalsResult(EMPTY_ARRIVALS, { ok: true, value: first }), { data: first, failed: false, slow: false });
});

test('keeps the last known data and marks failure when a refresh fails', () => {
  const state = applyArrivalsResult({ data: first, failed: false, slow: false }, { ok: false });
  assert.deepEqual(state, { data: first, failed: true, slow: false });
});

test('keeps no data when the very first load fails', () => {
  assert.deepEqual(applyArrivalsResult(EMPTY_ARRIVALS, { ok: false }), { data: null, failed: true, slow: false });
});

test('clears the failure flag when a later refresh succeeds', () => {
  const failed = applyArrivalsResult({ data: first, failed: false, slow: false }, { ok: false });
  assert.deepEqual(applyArrivalsResult(failed, { ok: true, value: second }), { data: second, failed: false, slow: false });
});

test('ignores a late response older than the data on screen', () => {
  const current = { data: second, failed: false, slow: false };
  assert.equal(applyArrivalsResult(current, { ok: true, value: first }), current);
});

test('flags a slow first load while no data has arrived', () => {
  assert.deepEqual(markSlowLoad(EMPTY_ARRIVALS), { data: null, failed: false, slow: true });
});

test('ignores the slow flag once data is on screen', () => {
  const state = { data: first, failed: false, slow: false };
  assert.equal(markSlowLoad(state), state);
});

test('clears the slow flag when the first load succeeds', () => {
  const slow = markSlowLoad(EMPTY_ARRIVALS);
  assert.deepEqual(applyArrivalsResult(slow, { ok: true, value: first }), { data: first, failed: false, slow: false });
});

test('setStopState stores a fresh result under its stop code, leaving other stops alone', () => {
  const next = setStopState({ '01013': EMPTY_ARRIVALS }, '01012', { ok: true, value: first });
  assert.deepEqual(next['01012'], { data: first, failed: false, slow: false });
  assert.equal(next['01013'], EMPTY_ARRIVALS);
});

test('setStopState keeps the last good times when a re-sync fails', () => {
  const good = setStopState({}, '01012', { ok: true, value: first });
  const next = setStopState(good, '01012', { ok: false });
  assert.deepEqual(next['01012'].data, first);
  assert.equal(next['01012'].failed, true);
});
