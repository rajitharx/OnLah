// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BusArrivalsResponse, BusStop } from '../../types/domain';
import { cleanup, renderHook } from '@testing-library/react';
import { pendingCalls, setHidden, tick } from '../../shared/testing/browserFakes';
import { useStopArrivals } from './useStopArrivals';

const arrivals = vi.hoisted(() => ({ fn: (..._args: unknown[]): Promise<unknown> => Promise.reject(new Error('unset')) }));
vi.mock('../../shared/services/onlahApi', () => ({ api: { getArrivals: (...args: unknown[]) => arrivals.fn(...args) } }));

function stop(busStopCode: string): BusStop {
  return { busStopCode, roadName: 'Road', description: `Stop ${busStopCode}`, latitude: 1.3, longitude: 103.8, distanceMeters: 0 };
}

function response(stopCode: string, fetchedAt = '2026-11-04T10:00:00Z'): BusArrivalsResponse {
  return { stopCode, fetchedAt, services: [] };
}

let api: ReturnType<typeof pendingCalls<BusArrivalsResponse>>;

beforeEach(() => {
  vi.useFakeTimers();
  api = pendingCalls<BusArrivalsResponse>();
  arrivals.fn = api.fn;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useStopArrivals', () => {
  it('starts no second request while one is still running, from the timer or the Refresh button', () => {
    const hook = renderHook(({ s }: { s: BusStop }) => useStopArrivals(s), { initialProps: { s: stop('01121') } });
    tick(20_000);
    hook.result.current.refresh();
    expect(api.calls).toHaveLength(1);
  });

  it('polls again on the next tick once the request finishes', async () => {
    renderHook(({ s }: { s: BusStop }) => useStopArrivals(s), { initialProps: { s: stop('01121') } });
    await api.calls[0].resolve(response('01121'));
    tick(20_000);
    expect(api.calls).toHaveLength(2);
  });

  it('never shows the previous stop’s arrivals under the new stop', async () => {
    const shown: (string | undefined)[] = [];
    const hook = renderHook(
      ({ s }: { s: BusStop }) => {
        const state = useStopArrivals(s);
        shown.push(state.data?.stopCode);
        return state;
      },
      { initialProps: { s: stop('01121') } },
    );
    await api.calls[0].resolve(response('01121'));
    expect(hook.result.current.data?.stopCode).toBe('01121');

    const before = shown.length;
    hook.rerender({ s: stop('02049') });
    expect(shown.length).toBeGreaterThan(before);
    expect(shown.slice(before).filter((code) => code !== undefined)).toEqual([]);
  });

  it('pauses while the tab is hidden and refetches when it returns', async () => {
    renderHook(({ s }: { s: BusStop }) => useStopArrivals(s), { initialProps: { s: stop('01121') } });
    await api.calls[0].resolve(response('01121'));
    setHidden(true);
    tick(60_000);
    expect(api.calls).toHaveLength(1);

    setHidden(false);
    expect(api.calls).toHaveLength(2);
    await api.calls[1].resolve(response('01121'));
    tick(20_000);
    expect(api.calls).toHaveLength(3);
  });
});
