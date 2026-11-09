import { serverClock, type ServerClock } from '../utils/serverClock';
import type { ProbeResult } from './apiStatus';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5066';
const TIMEOUT_MS = 15_000;

// The backend returns RFC 9457 problem details. `detail` is safe to show: it never contains internals.
// status 0 means the request never got an answer (timeout).
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiClient {
  get<T>(path: string, signal?: AbortSignal): Promise<T>;
  // Asks the host's /health, which needs no key. Never rejects.
  health(signal?: AbortSignal): Promise<ProbeResult>;
}

interface ApiClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  clock?: ServerClock;
  timeoutMs?: number;
}

export function createApiClient({
  baseUrl,
  fetchImpl = (url, init) => fetch(url, init),
  clock = serverClock,
  timeoutMs = TIMEOUT_MS,
}: ApiClientOptions): ApiClient {
  // Runs one request that ends when the caller aborts or the timeout passes, whichever comes first. The timer
  // keeps running while `read` consumes the body, so a stalled body cannot hang the caller.
  async function request<T>(
    path: string,
    caller: AbortSignal | undefined,
    read: (response: Response) => Promise<T>,
  ): Promise<T> {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const onCallerAbort = (): void => controller.abort();
    if (caller?.aborted) controller.abort();
    caller?.addEventListener('abort', onCallerAbort);
    try {
      const response = await fetchImpl(`${baseUrl}${path}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      return await read(response);
    } catch (error) {
      if (timedOut) throw new ApiError(0, 'The request timed out.');
      throw error;
    } finally {
      clearTimeout(timer);
      caller?.removeEventListener('abort', onCallerAbort);
    }
  }

  return {
    get<T>(path: string, signal?: AbortSignal): Promise<T> {
      return request(path, signal, async (response) => {
        if (!response.ok) throw await toApiError(response);
        let body: T;
        try {
          body = (await response.json()) as T;
        } catch (error) {
          if (error instanceof SyntaxError) throw new ApiError(response.status, 'The server sent an unexpected response.');
          throw error;
        }
        const fetchedAt = (body as { fetchedAt?: unknown } | null)?.fetchedAt;
        if (typeof fetchedAt === 'string') clock.sync(fetchedAt);
        return body;
      });
    },
    async health(signal?: AbortSignal): Promise<ProbeResult> {
      const started = performance.now();
      try {
        const ok = await request('/health', signal, async (response) => response.ok);
        return { ok, ms: performance.now() - started };
      } catch {
        return { ok: false, ms: performance.now() - started };
      }
    },
  };
}

async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as { detail?: unknown } | null;
  const detail = typeof body?.detail === 'string' ? body.detail : null;
  return new ApiError(response.status, detail ?? `Request failed with status ${response.status}.`);
}

export const apiClient: ApiClient = createApiClient({ baseUrl: BASE_URL });
