// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { tick } from '../testing/browserFakes';
import { useApiStatus } from './useApiStatus';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

async function settle(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('useApiStatus', () => {
  it('shows checking until the first answer', () => {
    const hook = renderHook(() => useApiStatus(() => new Promise(() => undefined), 10_000));
    expect(hook.result.current).toBe('checking');
  });

  it('turns good, then red when the API stops answering, then good again', async () => {
    const answers = [true, false, true];
    const probe = vi.fn(async () => ({ ok: answers.shift() ?? true, ms: 80 }));
    const hook = renderHook(() => useApiStatus(probe, 10_000));

    await settle();
    expect(hook.result.current).toBe('good');

    act(() => tick(10_000));
    await settle();
    expect(hook.result.current).toBe('down');

    act(() => tick(10_000));
    await settle();
    expect(hook.result.current).toBe('good');
  });

  it('shows amber for a slow answer', async () => {
    const hook = renderHook(() => useApiStatus(async () => ({ ok: true, ms: 5_000 }), 10_000));
    await settle();
    expect(hook.result.current).toBe('slow');
  });

  it('treats a probe that throws as down', async () => {
    const hook = renderHook(() => useApiStatus(() => Promise.reject(new Error('network')), 10_000));
    await settle();
    expect(hook.result.current).toBe('down');
  });

  it('stops probing once unmounted', async () => {
    const probe = vi.fn(async () => ({ ok: true, ms: 80 }));
    const hook = renderHook(() => useApiStatus(probe, 10_000));
    await settle();
    hook.unmount();
    act(() => tick(30_000));
    expect(probe).toHaveBeenCalledTimes(1);
  });
});
