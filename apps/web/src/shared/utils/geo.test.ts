import { describe, expect, it } from 'vitest';
import { mapsUrl } from './geo';

describe('mapsUrl', () => {
  it('opens the stop\'s coordinates in Google Maps', () => {
    expect(mapsUrl(1.3123, 103.8456)).toBe('https://www.google.com/maps/search/?api=1&query=1.3123,103.8456');
  });
});
