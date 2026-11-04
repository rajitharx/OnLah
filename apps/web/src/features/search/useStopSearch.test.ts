import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BusStop } from '../../types/domain';
import { renderHook } from '../../shared/testing/hookHarness';

vi.mock('react', async () => (await import('../../shared/testing/hookHarness')).fakeReact);

const searchBusStops = vi.hoisted(() => vi.fn());
vi.mock('../../shared/services/onlahApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../shared/services/onlahApi')>()),
  api: { searchBusStops },
}));

import { useStopSearch } from './useStopSearch';

const stop = { busStopCode: '01012' } as BusStop;
const settle = async (): Promise<void> => {
  await vi.advanceTimersByTimeAsync(300);
};

describe('useStopSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('window', globalThis);
    searchBusStops.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('searches the term once after the debounce', async () => {
    searchBusStops.mockResolvedValue([stop]);
    const hook = renderHook(({ query, attempt }) => useStopSearch(query, attempt), { query: 'Victoria', attempt: 0 });
    await settle();
    expect(searchBusStops).toHaveBeenCalledTimes(1);
    expect(hook.result.results).toEqual([stop]);
  });

  it('searches the same term again when the attempt changes', async () => {
    searchBusStops.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce([stop]);
    const hook = renderHook(({ query, attempt }) => useStopSearch(query, attempt), { query: 'Victoria', attempt: 0 });
    await settle();
    expect(hook.result.failure).toBe('unavailable');

    hook.rerender({ query: 'Victoria', attempt: 1 });
    await settle();

    expect(searchBusStops).toHaveBeenCalledTimes(2);
    expect(hook.result.failure).toBeNull();
    expect(hook.result.results).toEqual([stop]);
  });
});
