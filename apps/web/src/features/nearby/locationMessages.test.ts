import { describe, expect, it } from 'vitest';
import { locationErrorMessage } from './locationMessages';

describe('locationErrorMessage', () => {
  it('explains a blocked location and points to the browser setting and Search', () => {
    expect(locationErrorMessage(1)).toBe(
      'Location is blocked for this site. Allow it in your browser settings, or search for a stop instead.',
    );
  });

  it('says the location cannot be found right now', () => {
    expect(locationErrorMessage(2)).toBe('Your location is unavailable right now. Try again, or search for a stop instead.');
  });

  it('says finding the location took too long', () => {
    expect(locationErrorMessage(3)).toBe('Finding your location took too long. Try again, or search for a stop instead.');
  });
});
