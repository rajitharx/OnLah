import { describe, expect, it } from 'vitest';
import { mapsUrl, sortByDistance } from './geo';

describe('mapsUrl', () => {
  it('opens the stop\'s coordinates in Google Maps', () => {
    expect(mapsUrl(1.3123, 103.8456)).toBe('https://www.google.com/maps/search/?api=1&query=1.3123,103.8456');
  });
});

describe('sortByDistance', () => {
  it('puts the nearest stop first', () => {
    const stops = [{ distanceMeters: 800 }, { distanceMeters: 120 }, { distanceMeters: 420 }];
    expect(sortByDistance(stops).map((s) => s.distanceMeters)).toEqual([120, 420, 800]);
  });
});
