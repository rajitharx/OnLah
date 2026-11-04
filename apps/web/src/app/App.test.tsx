// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { BusStop } from '../types/domain';

const stop: BusStop = {
  busStopCode: '01121',
  roadName: 'Aft Victoria Lane',
  description: 'Aft Victoria Lane',
  latitude: 1.3,
  longitude: 103.8,
  distanceMeters: 0,
};

vi.mock('../shared/services/onlahApi', () => {
  const pending = (): Promise<never> => new Promise(() => undefined);
  return {
    api: {
      searchBusStops: () => Promise.resolve([stop]),
      getArrivals: () =>
        Promise.resolve({
          stopCode: '01121',
          fetchedAt: '2026-10-19T10:00:00Z',
          services: [{ serviceNo: '10', operator: 'SBST', nextBus: null, nextBus2: null, nextBus3: null, routes: [] }],
        }),
      getBusService: pending,
      getTrainAlerts: pending,
      getNearbyStops: pending,
      getRouteTracker: pending,
    },
  };
});

const { default: App } = await import('./App');

const settle = (path: string): Promise<void> => waitFor(() => expect(window.location.pathname).toBe(path));

async function goBack(): Promise<void> {
  window.history.back();
  await new Promise((resolve) => setTimeout(resolve, 20));
}

describe('App service sheet history', () => {
  beforeEach(() => {
    window.history.replaceState({ inApp: true }, '', '/search');
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/');
  });

  it('closing a sheet opened in the app steps back so Back does not land on the same board', async () => {
    window.history.pushState({ inApp: true }, '', '/stop/01121');
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Bus 10 details' }));
    await settle('/stop/01121/bus/10');
    expect(screen.getByRole('dialog')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Close bus details' }));
    await settle('/stop/01121');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    await goBack();
    await settle('/search');
  });

  it('closing a sheet opened from the Saved tab replaces the entry so Back reaches Saved', async () => {
    const saved = JSON.stringify([
      { stopCode: '01121', serviceNo: '10', stopName: 'Aft Victoria Lane', roadName: 'Aft Victoria Lane', latitude: 1.3, longitude: 103.8 },
    ]);
    vi.stubGlobal('localStorage', { getItem: () => saved, setItem: () => undefined, removeItem: () => undefined });
    window.history.replaceState({ inApp: true }, '', '/saved');
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: 'Bus 10 details' }));
    await settle('/stop/01121/bus/10');
    await screen.findByRole('dialog');
    const length = window.history.length;

    fireEvent.click(screen.getByRole('button', { name: 'Close bus details' }));
    await settle('/stop/01121');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(window.history.length).toBe(length);

    await goBack();
    await settle('/saved');
  });

  it('closing a sheet opened from a direct link replaces the entry', async () => {
    window.history.replaceState(null, '', '/stop/01121/bus/10');
    render(<App />);

    await screen.findByRole('dialog');
    const length = window.history.length;
    fireEvent.click(screen.getByRole('button', { name: 'Close bus details' }));

    await settle('/stop/01121');
    expect(window.history.length).toBe(length);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
