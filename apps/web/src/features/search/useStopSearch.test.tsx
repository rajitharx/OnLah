// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import type { BusStop } from '../../types/domain';

const searchBusStops = vi.hoisted(() => vi.fn());
vi.mock('../../shared/services/onlahApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../shared/services/onlahApi')>()),
  api: { searchBusStops },
}));

import { useStopSearch } from './useStopSearch';

const stop = { busStopCode: '01012' } as BusStop;
const props = (attempt: number) => ({ query: 'Victoria', attempt });

describe('useStopSearch', () => {
  beforeEach(() => {
    searchBusStops.mockReset();
  });
  afterEach(cleanup);

  it('searches the term once after the debounce', async () => {
    searchBusStops.mockResolvedValue([stop]);
    const { result } = renderHook(({ query, attempt }) => useStopSearch(query, attempt), { initialProps: props(0) });
    await waitFor(() => expect(result.current.results).toEqual([stop]));
    expect(searchBusStops).toHaveBeenCalledTimes(1);
  });

  it('searches the same term again when the attempt changes', async () => {
    searchBusStops.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce([stop]);
    const { result, rerender } = renderHook(({ query, attempt }) => useStopSearch(query, attempt), { initialProps: props(0) });
    await waitFor(() => expect(result.current.failure).toBe('unavailable'));

    rerender(props(1));
    await waitFor(() => expect(result.current.results).toEqual([stop]));
    expect(searchBusStops).toHaveBeenCalledTimes(2);
    expect(result.current.failure).toBeNull();
  });
});
