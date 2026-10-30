import { describe, expect, it } from 'vitest';
import { bumpVersion, parseVersion } from '../../scripts/bump-version.mjs';
import { APP_VERSION, betaLabel, compareVersions } from './version';

describe('parseVersion', () => {
  it('reads a major.minor version', () => {
    expect(parseVersion('0.1')).toEqual({ major: 0, minor: 1 });
  });

  it('rejects a three-part version, because the app shows two parts only', () => {
    expect(() => parseVersion('0.1.0')).toThrow('major.minor');
  });
});

describe('bumpVersion', () => {
  it('moves the minor number up by one', () => {
    expect(bumpVersion('0.1', 'minor')).toBe('0.2');
  });

  it('moves the major number up and resets the minor number', () => {
    expect(bumpVersion('0.9', 'major')).toBe('1.0');
  });
});

describe('betaLabel', () => {
  it('labels the build as a beta with its version number', () => {
    expect(betaLabel('0.1')).toBe('Beta 0.1');
  });

  it('shows the shipped version as two digits', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+$/);
    expect(betaLabel(APP_VERSION)).toBe(`Beta ${APP_VERSION}`);
  });
});

describe('compareVersions', () => {
  it('compares the minor number as a number, not as text', () => {
    expect(compareVersions('1.9', '1.10')).toBeLessThan(0);
    expect(compareVersions('1.53', '1.6')).toBeGreaterThan(0);
  });

  it('lets the major number outrank the minor number', () => {
    expect(compareVersions('2.0', '1.99')).toBeGreaterThan(0);
  });

  it('rejects a malformed version', () => {
    expect(() => compareVersions('1.2.3', '1.2')).toThrow('major.minor');
    expect(() => compareVersions('1.2', 'beta')).toThrow('major.minor');
  });

  it('returns zero for equal versions', () => {
    expect(compareVersions('1.51', '1.51')).toBe(0);
  });
});
