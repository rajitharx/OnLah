import { describe, expect, it } from 'vitest';
import type { TrainAlertsResponse } from '../../types/domain';
import { nextStateOnFailure, type TrainAlertsState } from './useTrainAlerts';

const loaded: TrainAlertsResponse = {
  data: { status: 'normal', alerts: [] },
  fetchedAt: '2026-10-26T10:00:00Z',
};

describe('nextStateOnFailure', () => {
  it('becomes unavailable when nothing has loaded yet', () => {
    expect(nextStateOnFailure({ status: 'loading' })).toEqual({ status: 'unavailable' });
  });

  it('keeps the last result when one already loaded', () => {
    const current: TrainAlertsState = { status: 'ok', alerts: loaded };
    expect(nextStateOnFailure(current)).toBe(current);
  });

  it('stays unavailable', () => {
    expect(nextStateOnFailure({ status: 'unavailable' })).toEqual({ status: 'unavailable' });
  });
});
