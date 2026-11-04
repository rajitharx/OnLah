// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import type { BusStop } from '../../types/domain';

const searchBusStops = vi.hoisted(() => vi.fn());
vi.mock('../../shared/services/onlahApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../shared/services/onlahApi')>()),
  api: { searchBusStops },
}));

import { useBoardStop } from './useBoardStop';

const stop = { busStopCode: '01012' } as BusStop;

describe('useBoardStop', () => {
  beforeEach(() => {
    searchBusStops.mockReset();
  });
  afterEach(cleanup);

  it('looks the stop up again when the attempt changes after a failure', async () => {
    searchBusStops.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce([stop]);
    const { result, rerender } = renderHook(({ attempt }) => useBoardStop('01012', null, attempt), { initialProps: { attempt: 0 } });
    await waitFor(() => expect(result.current.status).toBe('failed'));

    rerender({ attempt: 1 });
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current).toEqual({ stop, status: 'ready' }));
    expect(searchBusStops).toHaveBeenCalledTimes(2);
  });

  it('does not look up a stop that is already known', () => {
    renderHook(({ attempt }) => useBoardStop('01012', stop, attempt), { initialProps: { attempt: 0 } });
    expect(searchBusStops).not.toHaveBeenCalled();
  });
});
