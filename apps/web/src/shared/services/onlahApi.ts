import { resolveApiBaseUrl } from './apiBaseUrl';
import { serverClock, type ServerClock } from './serverClock';
import type { BusArrivalsResponse, BusStop, TrainAlertsResponse } from '../../types/domain';
import type { BusServiceDetails } from '../../types/busService';
import type { RouteTracker } from '../../types/routeTracker';

export type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<Response>;

// The backend returns RFC 9457 problem details. `detail` is safe to show: it never contains internals.
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface OnlahApi {
  getArrivals(stopCode: string, signal?: AbortSignal): Promise<BusArrivalsResponse>;
  searchBusStops(query: string, signal?: AbortSignal): Promise<BusStop[]>;
  getNearbyStops(latitude: number, longitude: number, radiusMeters: number, signal?: AbortSignal): Promise<BusStop[]>;
  getTrainAlerts(signal?: AbortSignal): Promise<TrainAlertsResponse>;
  getBusService(serviceNo: string, signal?: AbortSignal): Promise<BusServiceDetails>;
  getRouteTracker(busStopCode: string, serviceNo: string, signal?: AbortSignal): Promise<RouteTracker>;
}

const defaultFetch: FetchLike = (url, init) => fetch(url, init);

export function createOnlahApi(
  baseUrl: string,
  fetchImpl: FetchLike = defaultFetch,
  clock: ServerClock = serverClock,
): OnlahApi {
  async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await fetchImpl(`${baseUrl}${path}`, { signal });
    if (!response.ok) throw await toApiError(response);
    const body = (await response.json()) as T;
    const fetchedAt = (body as { fetchedAt?: unknown } | null)?.fetchedAt;
    if (typeof fetchedAt === 'string') clock.sync(fetchedAt);
    return body;
  }

  return {
    getArrivals: (stopCode, signal) =>
      get<BusArrivalsResponse>(`/api/v1/bus-arrivals?stopCode=${encodeURIComponent(stopCode)}`, signal),
    searchBusStops: (query, signal) =>
      get<BusStop[]>(`/api/v1/bus-stops/search?query=${encodeURIComponent(query)}`, signal),
    getNearbyStops: (latitude, longitude, radiusMeters, signal) =>
      get<BusStop[]>(
        `/api/v1/bus-stops/nearby?lat=${latitude}&lng=${longitude}&radiusMeters=${radiusMeters}`,
        signal,
      ),
    getTrainAlerts: (signal) => get<TrainAlertsResponse>('/api/v1/train-alerts', signal),
    getBusService: (serviceNo, signal) =>
      get<BusServiceDetails>(`/api/v1/bus-services/${encodeURIComponent(serviceNo)}`, signal),
    getRouteTracker: (busStopCode, serviceNo, signal) =>
      get<RouteTracker>(
        `/api/v1/route-tracker?busStopCode=${encodeURIComponent(busStopCode)}&serviceNo=${encodeURIComponent(serviceNo)}`,
        signal,
      ),
  };
}

async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as { detail?: unknown } | null;
  const detail = typeof body?.detail === 'string' ? body.detail : null;
  return new ApiError(response.status, detail ?? `Request failed with status ${response.status}.`);
}

const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const api: OnlahApi = createOnlahApi(API_BASE_URL);
