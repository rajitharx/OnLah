// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { BusStop } from '../../types/domain';

const getNearbyStops = vi.hoisted(() => vi.fn());
vi.mock('../../shared/services/onlahApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../shared/services/onlahApi')>()),
  api: { getNearbyStops },
}));

import { NearbyView } from './NearbyView';

const stop = {
  busStopCode: '01012',
  roadName: 'Victoria St',
  description: 'Hotel Grand Pacific',
  latitude: 1.3,
  longitude: 103.8,
  distanceMeters: 50,
} as BusStop;

describe('NearbyView retry', () => {
  beforeEach(() => {
    getNearbyStops.mockReset();
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (ok: (pos: { coords: { latitude: number; longitude: number } }) => void) =>
          ok({ coords: { latitude: 1.3, longitude: 103.8 } }),
      },
    });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('a successful locate fetches once, not twice', async () => {
    getNearbyStops.mockResolvedValue([stop]);
    render(<NearbyView onOpen={() => undefined} onNavigate={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: /Use my location/ }));
    await screen.findByText('Hotel Grand Pacific');
    expect(getNearbyStops).toHaveBeenCalledTimes(1);
  });

  it('Try again fetches again after a failure', async () => {
    getNearbyStops.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([stop]);
    render(<NearbyView onOpen={() => undefined} onNavigate={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: /Use my location/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    await screen.findByText('Hotel Grand Pacific');
    expect(getNearbyStops).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull());
  });
});
