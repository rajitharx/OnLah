import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BusStop } from '../../types/domain';
import { renderHook } from '../../shared/testing/hookHarness';

vi.mock('react', async () => (await import('../../shared/testing/hookHarness')).fakeReact);

const getNearbyStops = vi.hoisted(() => vi.fn());
vi.mock('../../shared/services/onlahApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../shared/services/onlahApi')>()),
  api: { getNearbyStops },
}));

import { useNearbyStops } from './useNearbyStops';

const stop = { busStopCode: '01012' } as BusStop;
const origin = { latitude: 1.3, longitude: 103.8 };
const settle = async (): Promise<void> => {
  await vi.advanceTimersByTimeAsync(0);
};

describe('useNearbyStops', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getNearbyStops.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it('fetches nothing until there is a location', async () => {
    const hook = renderHook(({ attempt }) => useNearbyStops(null, attempt), { attempt: 0 });
    await settle();
    expect(getNearbyStops).not.toHaveBeenCalled();
    expect(hook.result).toEqual({ stops: [], loading: false, failed: false });
  });

  it('fetches again for the same coordinates when the attempt changes, so a failure can be retried', async () => {
    getNearbyStops.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([stop]);
    const hook = renderHook(({ attempt }) => useNearbyStops(origin, attempt), { attempt: 0 });
    await settle();
    expect(hook.result.failed).toBe(true);

    hook.rerender({ attempt: 1 });
    expect(hook.result.loading).toBe(true);
    await settle();

    expect(getNearbyStops).toHaveBeenCalledTimes(2);
    expect(hook.result).toEqual({ stops: [stop], loading: false, failed: false });
  });

  it('does not fetch again when nothing changed', async () => {
    getNearbyStops.mockResolvedValue([stop]);
    const hook = renderHook(({ attempt }) => useNearbyStops({ ...origin }, attempt), { attempt: 0 });
    await settle();
    hook.rerender({ attempt: 0 });
    await settle();
    expect(getNearbyStops).toHaveBeenCalledTimes(1);
  });
});
