import { describe, expect, it } from 'vitest';
import type { TrainAlertsResponse } from '../../types/domain';
import { nextStateOnFailure, nextStateOnSuccess, type TrainAlertsState } from './useTrainAlerts';

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

  it('clears a failed refresh flag when the next fetch succeeds', () => {
    const failed = nextStateOnFailure(nextStateOnSuccess(loaded));
    expect(failed).toMatchObject({ refreshFailed: true });
    expect(nextStateOnSuccess(loaded)).toMatchObject({ refreshFailed: false });
  });
});
