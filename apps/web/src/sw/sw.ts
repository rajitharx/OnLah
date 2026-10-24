import {
  REFERENCE_CACHE,
  REFERENCE_MAX_ENTRIES,
  SHELL_DOCUMENT,
  apiOriginFromWorkerUrl,
  cachesToDelete,
  classifyRequest,
  isCacheable,
  shellCacheName,
} from './policy';

declare const __PRECACHE__: string[];
declare const __VERSION__: string;

interface ExtendableEventLike extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

interface FetchEventLike extends ExtendableEventLike {
  request: Request;
  respondWith(response: Promise<Response>): void;
}

interface WorkerScope {
  location: Location;
  clients: { claim(): Promise<void> };
  skipWaiting(): Promise<void>;
  addEventListener(type: 'install' | 'activate', listener: (event: ExtendableEventLike) => void): void;
  addEventListener(type: 'fetch', listener: (event: FetchEventLike) => void): void;
}

const worker = self as unknown as WorkerScope;
const SHELL_CACHE = shellCacheName(__VERSION__);
const apiOrigin = apiOriginFromWorkerUrl(worker.location.href);

worker.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(__PRECACHE__))
      .then(() => worker.skipWaiting()),
  );
});

worker.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(cachesToDelete(names, SHELL_CACHE).map((name) => caches.delete(name))))
      .then(() => worker.clients.claim()),
  );
});

async function trim(cache: Cache): Promise<void> {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - REFERENCE_MAX_ENTRIES)).map((key) => cache.delete(key)));
}

async function shellResponse(request: Request): Promise<Response> {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheable(response.status)) await cache.put(request, response.clone());
  return response;
}

async function navigationResponse(request: Request): Promise<Response> {
  const cache = await caches.open(SHELL_CACHE);
  const shell = await cache.match(SHELL_DOCUMENT);
  return shell ?? fetch(request);
}

async function referenceResponse(event: FetchEventLike): Promise<Response> {
  const { request } = event;
  const cache = await caches.open(REFERENCE_CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request).then(async (response) => {
    if (isCacheable(response.status)) {
      await cache.put(request, response.clone());
      await trim(cache);
    }
    return response;
  });
  if (cached) {
    event.waitUntil(refresh.catch(() => undefined));
    return cached;
  }
  return refresh;
}

worker.addEventListener('fetch', (event) => {
  const { request } = event;
  const handling = classifyRequest(request, worker.location.origin, apiOrigin);
  if (handling === 'network') return;
  if (handling === 'navigate') event.respondWith(navigationResponse(request));
  else if (handling === 'shell') event.respondWith(shellResponse(request));
  else event.respondWith(referenceResponse(event));
});
