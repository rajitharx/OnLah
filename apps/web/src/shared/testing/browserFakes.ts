import { act } from '@testing-library/react';
import { vi } from 'vitest';

export interface PendingCall<T> {
  args: unknown[];
  signal: AbortSignal | undefined;
  resolve(value: T): Promise<void>;
  reject(error: unknown): Promise<void>;
}

// A stub API method whose requests stay pending until the test settles them.
export function pendingCalls<T>() {
  const calls: PendingCall<T>[] = [];
  const fn = (...args: unknown[]): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const last = args[args.length - 1];
      calls.push({
        args,
        signal: last instanceof AbortSignal ? last : undefined,
        resolve: (value) => act(async () => resolve(value)),
        reject: (error) => act(async () => reject(error)),
      });
    });
  return { calls, fn };
}

// Needs jsdom. vi.restoreAllMocks puts document.hidden back.
export function setHidden(hidden: boolean): void {
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(hidden);
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

// Node 25 and later define their own global localStorage, which hides jsdom's. Undo with vi.unstubAllGlobals.
export function useJsdomStorage(): void {
  vi.stubGlobal('localStorage', (globalThis as unknown as { jsdom: { window: Window } }).jsdom.window.localStorage);
}

// The browser fires 'storage' only in the tabs that did not make the write.
export function writeFromOtherTab(key: string, value: string): void {
  window.localStorage.setItem(key, value);
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: value }));
  });
}

export function tick(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}
