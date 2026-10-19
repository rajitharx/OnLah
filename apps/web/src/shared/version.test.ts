import { describe, expect, it } from 'vitest';
import { APP_VERSION, betaLabel } from './version';

describe('betaLabel', () => {
  it('labels the build as a beta with its version number', () => {
    expect(betaLabel('0.1.0')).toBe('Beta 0.1.0');
  });

  it('shows the version the app ships with', () => {
    expect(betaLabel(APP_VERSION)).toBe(`Beta ${APP_VERSION}`);
  });
});
