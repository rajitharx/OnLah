import { describe, expect, it } from 'vitest';
import {
  REFERENCE_CACHE,
  apiOriginFromWorkerUrl,
  cachesToDelete,
  classifyRequest,
  isCacheable,
  shellCacheName,
} from './policy';

const ORIGIN = 'https://onlah.example';
const API = 'https://api.example';

function classify(url: string, init: { method?: string; mode?: string; api?: string | null } = {}) {
  return classifyRequest({ method: init.method ?? 'GET', url, mode: init.mode ?? 'cors' }, ORIGIN, init.api === undefined ? API : init.api);
}

describe('classifyRequest', () => {
  it('serves app navigations from the cached shell', () => {
    expect(classify(`${ORIGIN}/stop/01012`, { mode: 'navigate' })).toBe('navigate');
  });

  it('caches same-origin static files', () => {
    expect(classify(`${ORIGIN}/assets/index-abc.js`)).toBe('shell');
    expect(classify(`${ORIGIN}/manifest.webmanifest`)).toBe('shell');
    expect(classify(`${ORIGIN}/icon.svg`)).toBe('shell');
  });

  it('never handles the worker script itself', () => {
    expect(classify(`${ORIGIN}/sw.js`)).toBe('network');
    expect(classify(`${ORIGIN}/sw.js`, { mode: 'navigate' })).toBe('network');
  });

  it.each([
    '/api/v1/bus-arrivals?stopCode=01012',
    '/api/v1/train-alerts',
    '/api/v1/route-tracker?busStopCode=01012&serviceNo=197',
  ])('sends live endpoint %s to the network', (path) => {
    expect(classify(`${API}${path}`)).toBe('network');
    expect(classify(`${ORIGIN}${path}`)).toBe('network');
  });

  it.each(['/api/v1/bus-stops/search?query=orchard', '/api/v1/bus-stops/nearby?lat=1&lng=2&radiusMeters=300', '/api/v1/bus-services/197'])(
    'caches reference data %s with revalidation',
    (path) => {
      expect(classify(`${API}${path}`)).toBe('reference');
    },
  );

  it('does not match look-alike paths', () => {
    expect(classify(`${API}/api/v1/bus-stops-live`)).toBe('network');
  });

  it('ignores cross-origin requests it does not own', () => {
    expect(classify('https://fonts.googleapis.com/css2?family=Newsreader')).toBe('network');
    expect(classify('https://other.example/api/v1/bus-stops/search?query=a')).toBe('network');
    expect(classify(`${API}/api/v1/bus-stops/search?query=a`, { api: null })).toBe('network');
  });

  it('ignores non-GET requests and bad URLs', () => {
    expect(classify(`${API}/api/v1/bus-stops/search?query=a`, { method: 'POST' })).toBe('network');
    expect(classify('not a url')).toBe('network');
  });
});

describe('cache housekeeping', () => {
  it('deletes older shell caches and keeps the current ones', () => {
    const current = shellCacheName('v2');
    const existing = [shellCacheName('v1'), current, REFERENCE_CACHE, 'onlah-reference-v0', 'someone-elses-cache'];
    expect(cachesToDelete(existing, current)).toEqual([shellCacheName('v1'), 'onlah-reference-v0']);
  });

  it('caches only complete 200 responses', () => {
    expect(isCacheable(200)).toBe(true);
    expect(isCacheable(206)).toBe(false);
    expect(isCacheable(404)).toBe(false);
    expect(isCacheable(500)).toBe(false);
  });
});

describe('apiOriginFromWorkerUrl', () => {
  it('reads the API origin from the registration URL', () => {
    expect(apiOriginFromWorkerUrl(`${ORIGIN}/sw.js?api=${encodeURIComponent('https://api.example/')}`)).toBe(API);
  });

  it('returns null when missing or malformed', () => {
    expect(apiOriginFromWorkerUrl(`${ORIGIN}/sw.js`)).toBeNull();
    expect(apiOriginFromWorkerUrl(`${ORIGIN}/sw.js?api=nope`)).toBeNull();
  });
});
