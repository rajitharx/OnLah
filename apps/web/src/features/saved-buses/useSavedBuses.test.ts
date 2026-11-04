// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
import { useJsdomStorage, writeFromOtherTab } from '../../shared/testing/browserFakes';
import { SAVED_BUSES_KEY, type SavedBus } from './savedBusesStore';
import { useSavedBuses } from './useSavedBuses';

function bus(serviceNo: string): SavedBus {
  return { stopCode: '01121', serviceNo, stopName: 'Stop', roadName: 'Road', latitude: 1.3, longitude: 103.8 };
}

beforeEach(() => {
  useJsdomStorage();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe('useSavedBuses across tabs', () => {
  it('shows a bus saved in another tab', () => {
    const hook = renderHook(() => useSavedBuses());
    writeFromOtherTab(SAVED_BUSES_KEY, JSON.stringify([bus('961')]));
    expect(hook.result.current.buses.map((b) => b.serviceNo)).toEqual(['961']);
  });

  it('keeps a bus another tab saved when this tab saves one too', () => {
    const hook = renderHook(() => useSavedBuses());
    window.localStorage.setItem(SAVED_BUSES_KEY, JSON.stringify([bus('961')]));
    hook.result.current.toggle(bus('12'));

    const stored = JSON.parse(window.localStorage.getItem(SAVED_BUSES_KEY)!) as SavedBus[];
    expect(stored.map((b) => b.serviceNo).sort()).toEqual(['12', '961']);
  });
});
