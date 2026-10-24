// Pure caching decisions shared by the worker and its tests.

export type Handling = 'navigate' | 'shell' | 'reference' | 'network';

export interface RequestInfo {
  method: string;
  url: string;
  mode: string;
}

// Only these API paths are reference data. Arrivals, train alerts and the route tracker are live, so they are
// absent on purpose: a cached ETA is a wrong ETA.
const REFERENCE_PREFIXES = ['/api/v1/bus-stops', '/api/v1/bus-services'];

export const SHELL_CACHE_PREFIX = 'onlah-shell-';
export const REFERENCE_CACHE = 'onlah-reference-v1';
export const REFERENCE_MAX_ENTRIES = 150;
// Pages may answer /index.html with a redirect to /, and a redirected response cannot serve a navigation.
export const SHELL_DOCUMENT = '/';
export const WORKER_PATH = '/sw.js';

export function shellCacheName(version: string): string {
  return `${SHELL_CACHE_PREFIX}${version}`;
}

export function cachesToDelete(existing: string[], currentShell: string): string[] {
  return existing.filter(
    (name) => (name.startsWith(SHELL_CACHE_PREFIX) && name !== currentShell) || (name.startsWith('onlah-reference-') && name !== REFERENCE_CACHE),
  );
}

function isReferencePath(pathname: string): boolean {
  return REFERENCE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function classifyRequest(request: RequestInfo, origin: string, apiOrigin: string | null): Handling {
  if (request.method !== 'GET') return 'network';

  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return 'network';
  }

  if (url.origin === origin) {
    if (url.pathname === WORKER_PATH) return 'network';
    if (url.pathname.startsWith('/api/')) return 'network';
    return request.mode === 'navigate' ? 'navigate' : 'shell';
  }

  if (apiOrigin !== null && url.origin === apiOrigin && isReferencePath(url.pathname)) return 'reference';
  return 'network';
}

export function isCacheable(status: number): boolean {
  return status === 200;
}

export function apiOriginFromWorkerUrl(workerUrl: string): string | null {
  const value = new URL(workerUrl).searchParams.get('api');
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}
