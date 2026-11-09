import { apiClient, type ApiClient } from './apiClient';
import type { ProbeResult } from './apiStatus';
import type {
  BusArrivalsResponse,
  BusServiceDetails,
  BusStop,
  RouteTracker,
  TrainAlertsResponse,
} from '../../types/domain';

export interface OnlahApi {
  getHealth(signal?: AbortSignal): Promise<ProbeResult>;
  getArrivals(stopCode: string, signal?: AbortSignal): Promise<BusArrivalsResponse>;
  getNearbyStops(lat: number, lng: number, radiusMeters?: number, signal?: AbortSignal): Promise<BusStop[]>;
  searchBusStops(query: string, signal?: AbortSignal): Promise<BusStop[]>;
  getTrainAlerts(signal?: AbortSignal): Promise<TrainAlertsResponse>;
  getBusService(serviceNo: string, signal?: AbortSignal): Promise<BusServiceDetails>;
  getRouteTracker(
    busStopCode: string,
    serviceNo: string,
    signal?: AbortSignal,
    destinationCode?: string,
  ): Promise<RouteTracker>;
}

export function createOnlahApi(client: ApiClient): OnlahApi {
  return {
    getHealth: (signal) => client.health(signal),
    getArrivals: (stopCode, signal) =>
      client.get<BusArrivalsResponse>(`/api/v1/bus-arrivals?stopCode=${encodeURIComponent(stopCode)}`, signal),
    getNearbyStops: (lat, lng, radiusMeters = 500, signal) =>
      client.get<BusStop[]>(`/api/v1/bus-stops/nearby?lat=${lat}&lng=${lng}&radiusMeters=${radiusMeters}`, signal),
    searchBusStops: (query, signal) =>
      client.get<BusStop[]>(`/api/v1/bus-stops/search?query=${encodeURIComponent(query)}`, signal),
    getTrainAlerts: (signal) => client.get<TrainAlertsResponse>('/api/v1/train-alerts', signal),
    getBusService: (serviceNo, signal) =>
      client.get<BusServiceDetails>(`/api/v1/bus-services/${encodeURIComponent(serviceNo)}`, signal),
    getRouteTracker: (busStopCode, serviceNo, signal, destinationCode) => {
      const destination =
        destinationCode === undefined ? '' : `&destinationCode=${encodeURIComponent(destinationCode)}`;
      return client.get<RouteTracker>(
        `/api/v1/route-tracker?busStopCode=${encodeURIComponent(busStopCode)}&serviceNo=${encodeURIComponent(serviceNo)}${destination}`,
        signal,
      );
    },
  };
}

const api = createOnlahApi(apiClient);

export const getHealth = api.getHealth;
export const getArrivals = api.getArrivals;
export const getNearbyStops = api.getNearbyStops;
export const searchBusStops = api.searchBusStops;
export const getTrainAlerts = api.getTrainAlerts;
export const getBusService = api.getBusService;
export const getRouteTracker = api.getRouteTracker;
