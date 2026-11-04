// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import type { BusStop } from '../../types/domain';

const getNearbyStops = vi.hoisted(() => vi.fn());
vi.mock('../../shared/services/onlahApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../shared/services/onlahApi')>()),
  api: { getNearbyStops },
}));

import { useNearbyStops } from './useNearbyStops';

const stop = { busStopCode: '01012' } as BusStop;
const origin = { latitude: 1.3, longitude: 103.8 };

describe('useNearbyStops', () => {
  beforeEach(() => getNearbyStops.mockReset());
  afterEach(cleanup);

  it('fetches nothing until there is a location', () => {
    const { result } = renderHook(({ attempt }) => useNearbyStops(null, attempt), { initialProps: { attempt: 0 } });
    expect(getNearbyStops).not.toHaveBeenCalled();
    expect(result.current).toEqual({ stops: [], loading: false, failed: false });
  });

  it('fetches again for the same coordinates when the attempt changes, so a failure can be retried', async () => {
    getNearbyStops.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([stop]);
    const { result, rerender } = renderHook(({ attempt }) => useNearbyStops(origin, attempt), { initialProps: { attempt: 0 } });
    await waitFor(() => expect(result.current.failed).toBe(true));

    rerender({ attempt: 1 });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current).toEqual({ stops: [stop], loading: false, failed: false }));
    expect(getNearbyStops).toHaveBeenCalledTimes(2);
  });

  it('does not fetch again when nothing changed', async () => {
    getNearbyStops.mockResolvedValue([stop]);
    const { result, rerender } = renderHook(({ attempt }) => useNearbyStops({ ...origin }, attempt), { initialProps: { attempt: 0 } });
    await waitFor(() => expect(result.current.stops).toEqual([stop]));
    rerender({ attempt: 0 });
    expect(getNearbyStops).toHaveBeenCalledTimes(1);
  });
});
