// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BusArrivalsResponse } from '../../types/domain';
import { cleanup, renderHook } from '@testing-library/react';
import { pendingCalls, setHidden, tick } from '../../shared/testing/browserFakes';
import { useSavedArrivals } from './useSavedArrivals';

const arrivals = vi.hoisted(() => ({ fn: (..._args: unknown[]): Promise<unknown> => Promise.reject(new Error('unset')) }));
vi.mock('../../shared/services/onlahApi', () => ({ api: { getArrivals: (...args: unknown[]) => arrivals.fn(...args) } }));

function response(stopCode: string): BusArrivalsResponse {
  return { stopCode, fetchedAt: '2026-11-04T10:00:00Z', services: [] };
}

let api: ReturnType<typeof pendingCalls<BusArrivalsResponse>>;

const requestsFor = (code: string) => api.calls.filter((call) => call.args[0] === code);

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

describe('useSavedArrivals', () => {
  it('skips a stop on the timer and on Re-sync while its request is running, and still polls the others', async () => {
    const hook = renderHook(({ codes }: { codes: string[] }) => useSavedArrivals(codes), { initialProps: { codes: ['01121', '02049'] } });
    await requestsFor('02049')[0].resolve(response('02049'));

    tick(20_000);
    hook.result.current.resync('01121');
    expect(requestsFor('01121')).toHaveLength(1);
    expect(requestsFor('02049')).toHaveLength(2);
  });

  it('cancels a Re-sync request when the hook goes away', async () => {
    const hook = renderHook(({ codes }: { codes: string[] }) => useSavedArrivals(codes), { initialProps: { codes: ['01121'] } });
    await requestsFor('01121')[0].resolve(response('01121'));
    hook.result.current.resync('01121');
    const resync = requestsFor('01121')[1];

    hook.unmount();
    expect(resync.signal?.aborted).toBe(true);
  });

  it('pauses while the tab is hidden and refetches every stop when it returns', async () => {
    renderHook(({ codes }: { codes: string[] }) => useSavedArrivals(codes), { initialProps: { codes: ['01121', '02049'] } });
    for (const call of [...api.calls]) await call.resolve(response(call.args[0] as string));
    setHidden(true);
    tick(60_000);
    expect(api.calls).toHaveLength(2);

    setHidden(false);
    expect(api.calls).toHaveLength(4);
  });
});
