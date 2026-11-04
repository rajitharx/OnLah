// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { BusStop } from '../types/domain';

const stop: BusStop = {
  busStopCode: '01121',
  roadName: 'Aft Victoria Lane',
  description: 'Aft Victoria Lane',
  latitude: 1.3,
  longitude: 103.8,
  distanceMeters: 0,
};

const searchBusStops = vi.hoisted(() => vi.fn());
vi.mock('../shared/services/onlahApi', () => {
  const pending = (): Promise<never> => new Promise(() => undefined);
  return {
    api: {
      searchBusStops,
      getArrivals: pending,
      getBusService: pending,
      getTrainAlerts: pending,
      getNearbyStops: pending,
      getRouteTracker: pending,
    },
  };
});

const { default: App } = await import('./App');

describe('App stop link retry', () => {
  beforeEach(() => {
    searchBusStops.mockReset();
    window.history.replaceState({ inApp: true }, '', '/stop/01121');
  });
  afterEach(() => {
    cleanup();
    window.history.replaceState(null, '', '/');
  });

  it('Try again looks the stop up again after a failed load', async () => {
    searchBusStops.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce([stop]);
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    await screen.findAllByText(/Aft Victoria Lane/);
    expect(searchBusStops).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });
});
