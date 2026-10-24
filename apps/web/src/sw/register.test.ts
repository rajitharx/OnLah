import { describe, expect, it } from 'vitest';
import { shouldRegisterWorker, workerUrl } from './register';

const base = { isProduction: true, protocol: 'https:', hostname: 'onlah.example', supported: true };

describe('shouldRegisterWorker', () => {
  it('registers in production over HTTPS', () => {
    expect(shouldRegisterWorker(base)).toBe(true);
  });

  it('registers on localhost over plain HTTP so preview can be checked', () => {
    expect(shouldRegisterWorker({ ...base, protocol: 'http:', hostname: 'localhost' })).toBe(true);
    expect(shouldRegisterWorker({ ...base, protocol: 'http:', hostname: '127.0.0.1' })).toBe(true);
  });

  it('skips dev builds', () => {
    expect(shouldRegisterWorker({ ...base, isProduction: false })).toBe(false);
  });

  it('skips plain HTTP on a real host', () => {
    expect(shouldRegisterWorker({ ...base, protocol: 'http:' })).toBe(false);
  });

  it('skips browsers without service workers', () => {
    expect(shouldRegisterWorker({ ...base, supported: false })).toBe(false);
  });
});

describe('workerUrl', () => {
  it('passes the API origin to the worker', () => {
    expect(workerUrl('https://api.example/')).toBe('/sw.js?api=https%3A%2F%2Fapi.example');
  });

  it('omits it when the base URL is not absolute', () => {
    expect(workerUrl('')).toBe('/sw.js');
  });
});
