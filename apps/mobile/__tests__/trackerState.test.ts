import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  EMPTY_TRACKER,
  STALE_AFTER_MS,
  applyTrackerResult,
  isNotFound,
  isTrackerStale,
} from '../src/features/route-tracker/trackerState';
import type { RouteTracker } from '../src/types/domain';

const RECEIVED = 1_000_000;

const tracker = (): RouteTracker => ({
  serviceNo: '161',
  direction: 1,
  status: 'live',
  fetchedAt: '2026-10-21T12:00:00Z',
  destination: { sequence: 3, busStopCode: '3', description: 'End', roadName: '', distanceKm: 1 },
  userStopIndex: 1,
  stops: [],
  buses: [],
});

const fresh = () => applyTrackerResult(EMPTY_TRACKER, { ok: true, value: tracker() }, RECEIVED);

test('stores fresh data and clears earlier failures', () => {
  const next = applyTrackerResult({ ...EMPTY_TRACKER, failed: true }, { ok: true, value: tracker() }, RECEIVED);
  assert.equal(next.data?.serviceNo, '161');
  assert.equal(next.failed, false);
  assert.equal(next.receivedAt, RECEIVED);
});

test('keeps the last good data when a refresh fails', () => {
  const next = applyTrackerResult(fresh(), { ok: false, notFound: false }, RECEIVED + 1_000);
  assert.notEqual(next.data, null);
  assert.equal(next.failed, true);
});

test('drops the data when the stop or service is not found', () => {
  const next = applyTrackerResult(fresh(), { ok: false, notFound: true }, RECEIVED + 1_000);
  assert.equal(next.data, null);
  assert.equal(next.notFound, true);
});

test('fresh data is not stale, and goes stale after 60 seconds', () => {
  assert.equal(STALE_AFTER_MS, 60_000);
  assert.equal(isTrackerStale(fresh(), RECEIVED + 5_000), false);
  assert.equal(isTrackerStale(fresh(), RECEIVED + STALE_AFTER_MS), false);
  assert.equal(isTrackerStale(fresh(), RECEIVED + STALE_AFTER_MS + 1), true);
});

test('a failed refresh is stale at once, but only when there is data to be stale', () => {
  const failed = applyTrackerResult(fresh(), { ok: false, notFound: false }, RECEIVED + 2_000);
  assert.equal(isTrackerStale(failed, RECEIVED + 5_000), true);
  assert.equal(isTrackerStale(applyTrackerResult(EMPTY_TRACKER, { ok: false, notFound: false }, RECEIVED), RECEIVED), false);
});

test('only a 404 means not found', () => {
  assert.equal(isNotFound({ status: 404 }), true);
  assert.equal(isNotFound({ status: 503 }), false);
  assert.equal(isNotFound(new Error('x')), false);
  assert.equal(isNotFound(null), false);
});
