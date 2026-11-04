// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RouteTracker } from '../../types/routeTracker';
import { ApiError } from '../../shared/services/onlahApi';
import { cleanup, renderHook } from '@testing-library/react';
import { pendingCalls, setHidden, tick } from '../../shared/testing/browserFakes';
import { useRouteTracker } from './useRouteTracker';

const tracker = vi.hoisted(() => ({ fn: (..._args: unknown[]): Promise<unknown> => Promise.reject(new Error('unset')) }));
vi.mock('../../shared/services/onlahApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../shared/services/onlahApi')>()),
  api: { getRouteTracker: (...args: unknown[]) => tracker.fn(...args) },
}));

let api: ReturnType<typeof pendingCalls<RouteTracker>>;

beforeEach(() => {
  vi.useFakeTimers();
  api = pendingCalls<RouteTracker>();
  tracker.fn = api.fn;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useRouteTracker', () => {
  it('stops polling once the service is not found at the stop', async () => {
    const hook = renderHook(() => useRouteTracker('67009', '161'));
    await api.calls[0].reject(new ApiError(404, 'Not found'));
    expect(hook.result.current.notFound).toBe(true);

    tick(120_000);
    setHidden(true);
    setHidden(false);
    expect(api.calls).toHaveLength(1);
  });

  it('keeps polling after an ordinary failure', async () => {
    renderHook(() => useRouteTracker('67009', '161'));
    await api.calls[0].reject(new ApiError(503, 'Unavailable'));
    tick(20_000);
    expect(api.calls).toHaveLength(2);
  });
});
