// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BusStop } from '../../types/domain';
import { cleanup, renderHook } from '@testing-library/react';
import { useJsdomStorage, writeFromOtherTab } from '../../shared/testing/browserFakes';
import { FAVOURITES_KEY } from './favouritesStore';
import { useFavourites } from './useFavourites';

function stop(busStopCode: string): BusStop {
  return { busStopCode, roadName: 'Road', description: `Stop ${busStopCode}`, latitude: 1.3, longitude: 103.8, distanceMeters: 0 };
}

beforeEach(() => {
  useJsdomStorage();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe('useFavourites across tabs', () => {
  it('shows a stop saved in another tab', () => {
    const hook = renderHook(() => useFavourites());
    writeFromOtherTab(FAVOURITES_KEY, JSON.stringify([stop('01121')]));
    expect(hook.result.current.has('01121')).toBe(true);
  });

  it('keeps a stop another tab saved when this tab saves one too', () => {
    const hook = renderHook(() => useFavourites());
    window.localStorage.setItem(FAVOURITES_KEY, JSON.stringify([stop('01121')]));
    hook.result.current.toggle(stop('02049'));

    const stored = JSON.parse(window.localStorage.getItem(FAVOURITES_KEY)!) as BusStop[];
    expect(stored.map((s) => s.busStopCode).sort()).toEqual(['01121', '02049']);
  });
});
