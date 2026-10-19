import { describe, expect, it } from 'vitest';
import type { BusStop } from '../../types/domain';
import { MAX_FAVOURITES, addFavourite, isFavouritesFull, moveFavourite, parseFavourites, removeFavourite } from './favouritesStore';

const stop = (code: string): BusStop => ({
  busStopCode: code,
  roadName: 'Victoria St',
  description: `Stop ${code}`,
  latitude: 1.29,
  longitude: 103.85,
  distanceMeters: 0,
});

describe('parseFavourites', () => {
  it('returns an empty list when nothing is stored', () => {
    expect(parseFavourites(null)).toEqual([]);
  });

  it('returns an empty list when the stored value is not JSON', () => {
    expect(parseFavourites('{not json')).toEqual([]);
  });

  it('returns an empty list when the stored value is not an array', () => {
    expect(parseFavourites('{"busStopCode":"01012"}')).toEqual([]);
  });

  it('drops entries that are not stops, such as the old code-only format', () => {
    const raw = JSON.stringify(['01012', stop('03111'), { busStopCode: 7 }]);

    expect(parseFavourites(raw)).toEqual([stop('03111')]);
  });

  it('keeps at most MAX_FAVOURITES entries', () => {
    const raw = JSON.stringify(Array.from({ length: MAX_FAVOURITES + 3 }, (_, i) => stop(String(10000 + i))));

    expect(parseFavourites(raw)).toHaveLength(MAX_FAVOURITES);
  });
});

describe('addFavourite', () => {
  it('appends a new stop without changing the original list', () => {
    const original = [stop('01012')];

    const next = addFavourite(original, stop('03111'));

    expect(next.map((s) => s.busStopCode)).toEqual(['01012', '03111']);
    expect(original).toHaveLength(1);
  });

  it('does not add a stop that is already saved', () => {
    const original = [stop('01012')];

    expect(addFavourite(original, stop('01012'))).toEqual(original);
  });

  it('does not add past the maximum', () => {
    const full = Array.from({ length: MAX_FAVOURITES }, (_, i) => stop(String(10000 + i)));

    expect(addFavourite(full, stop('99999'))).toHaveLength(MAX_FAVOURITES);
  });
});

describe('removeFavourite', () => {
  it('removes the stop with the matching code', () => {
    const list = [stop('01012'), stop('03111')];

    expect(removeFavourite(list, '01012').map((s) => s.busStopCode)).toEqual(['03111']);
  });
});

describe('isFavouritesFull', () => {
  it('is true only at the maximum', () => {
    const full = Array.from({ length: MAX_FAVOURITES }, (_, i) => stop(String(10000 + i)));

    expect(isFavouritesFull(full.slice(1))).toBe(false);
    expect(isFavouritesFull(full)).toBe(true);
  });
});

describe('moveFavourite', () => {
  it('moves a saved stop down one place', () => {
    const list = [stop('01012'), stop('01013')];
    expect(moveFavourite(list, '01012', 1)).toEqual([stop('01013'), stop('01012')]);
  });
});
