import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BusStop } from '../../types/domain';
import { renderHook } from '../../shared/testing/hookHarness';

vi.mock('react', async () => (await import('../../shared/testing/hookHarness')).fakeReact);

const searchBusStops = vi.hoisted(() => vi.fn());
vi.mock('../../shared/services/onlahApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../shared/services/onlahApi')>()),
  api: { searchBusStops },
}));

import { useBoardStop } from './useBoardStop';

const stop = { busStopCode: '01012' } as BusStop;
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('useBoardStop', () => {
  beforeEach(() => searchBusStops.mockReset());

  it('looks the stop up again when the attempt changes after a failure', async () => {
    searchBusStops.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce([stop]);
    const hook = renderHook(({ attempt }) => useBoardStop('01012', null, attempt), { attempt: 0 });
    await settle();
    expect(hook.result.status).toBe('failed');

    hook.rerender({ attempt: 1 });
    expect(hook.result.status).toBe('loading');
    await settle();

    expect(searchBusStops).toHaveBeenCalledTimes(2);
    expect(hook.result).toEqual({ stop, status: 'ready' });
  });

  it('does not look up a stop that is already known', async () => {
    renderHook(({ attempt }) => useBoardStop('01012', stop, attempt), { attempt: 0 });
    await settle();
    expect(searchBusStops).not.toHaveBeenCalled();
  });
});
