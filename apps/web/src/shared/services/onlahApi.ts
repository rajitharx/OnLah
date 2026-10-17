import type { BusArrivalsResponse, BusStop, TrainAlertsResponse } from '../../types/domain';

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
}

const defaultFetch: FetchLike = (url, init) => fetch(url, init);

export function createOnlahApi(baseUrl: string, fetchImpl: FetchLike = defaultFetch): OnlahApi {
  async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await fetchImpl(`${baseUrl}${path}`, { signal });
    if (!response.ok) throw await toApiError(response);
    return (await response.json()) as T;
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
  };
}

async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as { detail?: unknown } | null;
  const detail = typeof body?.detail === 'string' ? body.detail : null;
  return new ApiError(response.status, detail ?? `Request failed with status ${response.status}.`);
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5050';

export const api: OnlahApi = createOnlahApi(API_BASE_URL);
