// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { BusStop } from '../../types/domain';

const searchBusStops = vi.hoisted(() => vi.fn());
vi.mock('../../shared/services/onlahApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../shared/services/onlahApi')>()),
  api: { searchBusStops },
}));

import { SearchView } from './SearchView';

const stop = {
  busStopCode: '01012',
  roadName: 'Victoria St',
  description: 'Hotel Grand Pacific',
  latitude: 1.3,
  longitude: 103.8,
  distanceMeters: 0,
} as BusStop;
const view = <SearchView query="Victoria" onQueryChange={() => undefined} onOpen={() => undefined} />;

describe('SearchView retry', () => {
  beforeEach(() => {
    searchBusStops.mockReset();
  });
  afterEach(cleanup);

  it('Try again searches the same text again after a network failure', async () => {
    searchBusStops.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce([stop]);
    render(view);
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    await screen.findByText(/Hotel Grand Pacific/);
    expect(searchBusStops).toHaveBeenCalledTimes(2);
  });

  it('offers no Try again when the text itself was rejected', async () => {
    searchBusStops.mockRejectedValue(new Error('odd body'));
    render(view);
    await screen.findByText("Couldn't search that text. Try different words.");
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });
});
