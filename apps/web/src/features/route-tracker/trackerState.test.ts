import { describe, expect, it } from 'vitest';
import type { RouteTracker } from '../../types/routeTracker';
import { createServerClock } from '../../shared/services/serverClock';
import { EMPTY_TRACKER, STALE_AFTER_MS, applyTrackerResult, isStale } from './trackerState';

const RECEIVED = 1_000_000;

const tracker = (fetchedAt: string): RouteTracker => ({
  serviceNo: '161',
  direction: 1,
  status: 'live',
  fetchedAt,
  destination: { sequence: 3, busStopCode: '3', description: 'End', roadName: '', distanceKm: 1 },
  userStopIndex: 1,
  stops: [],
  buses: [],
});

describe('applyTrackerResult', () => {
  it('stores fresh data and clears earlier failures', () => {
    const failed = { ...EMPTY_TRACKER, failed: true };

    const next = applyTrackerResult(failed, { ok: true, value: tracker('2026-10-21T12:00:00Z') }, RECEIVED);

    expect(next.data?.serviceNo).toBe('161');
    expect(next.failed).toBe(false);
  });

  it('keeps the last good data when a refresh fails', () => {
    const good = applyTrackerResult(EMPTY_TRACKER, { ok: true, value: tracker('2026-10-21T12:00:00Z') }, RECEIVED);

    const next = applyTrackerResult(good, { ok: false, notFound: false }, RECEIVED + 1_000);

    expect(next.data).not.toBeNull();
    expect(next.failed).toBe(true);
  });

  it('drops the data when the stop or service turns out not to exist', () => {
    const good = applyTrackerResult(EMPTY_TRACKER, { ok: true, value: tracker('2026-10-21T12:00:00Z') }, RECEIVED);

    const next = applyTrackerResult(good, { ok: false, notFound: true }, RECEIVED + 1_000);

    expect(next.data).toBeNull();
    expect(next.notFound).toBe(true);
  });
});

describe('isStale', () => {
  const fresh = (): ReturnType<typeof applyTrackerResult> =>
    applyTrackerResult(EMPTY_TRACKER, { ok: true, value: tracker('2026-10-21T12:00:00Z') }, RECEIVED);

  it('is fresh just after a good fetch', () => {
    expect(isStale(fresh(), RECEIVED + 5_000)).toBe(false);
  });

  it('is stale after a failed refresh, even if the data is recent', () => {
    const failed = applyTrackerResult(fresh(), { ok: false, notFound: false }, RECEIVED + 2_000);

    expect(isStale(failed, RECEIVED + 5_000)).toBe(true);
  });

  it('is stale when the data is older than the limit, for example after a hidden tab', () => {
    expect(isStale(fresh(), RECEIVED + STALE_AFTER_MS + 1_000)).toBe(true);
  });

  it('does not depend on the server clock, so a skewed device clock cannot make fresh data stale', () => {
    const skewed = applyTrackerResult(EMPTY_TRACKER, { ok: true, value: tracker('2020-01-01T00:00:00Z') }, RECEIVED);

    expect(isStale(skewed, RECEIVED + 5_000)).toBe(false);
  });

  it('is not stale when there is nothing to be stale', () => {
    expect(isStale(EMPTY_TRACKER, RECEIVED)).toBe(false);
  });
});

describe('staleness with a skewed device clock', () => {
  const FETCHED = '2026-10-21T12:00:00Z';

  it.each([-3_600_000, 0, 3_600_000])('is fresh then stale on server time with the device %i ms off', (skew) => {
    let mono = 1_000;
    const clock = createServerClock(() => mono, () => Date.parse(FETCHED) + skew);
    clock.sync(FETCHED);
    const state = applyTrackerResult(EMPTY_TRACKER, { ok: true, value: tracker(FETCHED) }, clock.now());

    mono += 5_000;
    expect(isStale(state, clock.now())).toBe(false);
    mono += STALE_AFTER_MS;
    expect(isStale(state, clock.now())).toBe(true);
  });
});
