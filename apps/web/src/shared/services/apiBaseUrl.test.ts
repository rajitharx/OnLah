import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './apiBaseUrl';

describe('resolveApiBaseUrl', () => {
  it('uses the configured URL without a trailing slash', () => {
    expect(resolveApiBaseUrl('https://onlah-api.onrender.com/')).toBe('https://onlah-api.onrender.com');
  });

  it('falls back to the local backend when nothing is configured', () => {
    expect(resolveApiBaseUrl(undefined)).toBe('http://localhost:5050');
  });

  it('treats a blank value as not configured', () => {
    expect(resolveApiBaseUrl('   ')).toBe('http://localhost:5050');
  });
});
