// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TrainAlertsResponse } from '../../types/domain';
import { cleanup, renderHook } from '@testing-library/react';
import { pendingCalls, setHidden, tick } from '../../shared/testing/browserFakes';
import { nextStateOnFailure, nextStateOnSuccess, useTrainAlerts, type TrainAlertsState } from './useTrainAlerts';

const trainAlerts = vi.hoisted(() => ({ fn: (..._args: unknown[]): Promise<unknown> => Promise.reject(new Error('unset')) }));
vi.mock('../../shared/services/onlahApi', () => ({ api: { getTrainAlerts: (...args: unknown[]) => trainAlerts.fn(...args) } }));

const loaded: TrainAlertsResponse = {
  data: { status: 0, alerts: [] },
  fetchedAt: '2026-10-26T10:00:00Z',
};

describe('nextStateOnFailure', () => {
  it('becomes unavailable when nothing has loaded yet', () => {
    expect(nextStateOnFailure({ status: 'loading' })).toEqual({ status: 'unavailable' });
  });

  it('keeps the last result and flags the failed refresh when one already loaded', () => {
    const current: TrainAlertsState = { status: 'ok', alerts: loaded, refreshFailed: false };
    expect(nextStateOnFailure(current)).toEqual({ status: 'ok', alerts: loaded, refreshFailed: true });
  });

  it('keeps the flag across repeated failures', () => {
    const failed: TrainAlertsState = { status: 'ok', alerts: loaded, refreshFailed: true };
    expect(nextStateOnFailure(failed)).toEqual(failed);
  });

  it('stays unavailable', () => {
    expect(nextStateOnFailure({ status: 'unavailable' })).toEqual({ status: 'unavailable' });
  });
});

describe('nextStateOnSuccess', () => {
  it('loads the result with no failed refresh', () => {
    expect(nextStateOnSuccess(loaded)).toEqual({ status: 'ok', alerts: loaded, refreshFailed: false });
  });

  it('marks a failed refresh and builds a success state with the flag unset', () => {
    const failed = nextStateOnFailure(nextStateOnSuccess(loaded));
    expect(failed).toMatchObject({ refreshFailed: true });
    expect(nextStateOnSuccess(loaded)).toMatchObject({ refreshFailed: false });
  });
});

describe('useTrainAlerts', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('pauses while the tab is hidden and refetches when it returns', async () => {
    vi.useFakeTimers();
    const api = pendingCalls<TrainAlertsResponse>();
    trainAlerts.fn = api.fn;

    renderHook(() => useTrainAlerts());
    await api.calls[0].resolve(loaded);
    setHidden(true);
    tick(600_000);
    expect(api.calls).toHaveLength(1);

    setHidden(false);
    expect(api.calls).toHaveLength(2);
  });
});
