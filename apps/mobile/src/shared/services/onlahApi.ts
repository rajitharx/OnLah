import { apiFetch } from './apiClient';
import { BusArrivalsResponse, BusStop, TrainAlertsResponse } from '../../types/domain';

export function getArrivals(stopCode: string): Promise<BusArrivalsResponse> {
  return apiFetch<BusArrivalsResponse>(
    `/api/v1/bus-arrivals?stopCode=${encodeURIComponent(stopCode)}`,
  );
}

export function getNearbyStops(
  lat: number,
  lng: number,
  radiusMeters = 500,
): Promise<BusStop[]> {
  return apiFetch<BusStop[]>(
    `/api/v1/bus-stops/nearby?lat=${lat}&lng=${lng}&radiusMeters=${radiusMeters}`,
  );
}

export function getTrainAlerts(): Promise<TrainAlertsResponse> {
  return apiFetch<TrainAlertsResponse>('/api/v1/train-alerts');
}

export function searchBusStops(query: string): Promise<BusStop[]> {
  return apiFetch<BusStop[]>(
    `/api/v1/bus-stops/search?query=${encodeURIComponent(query)}`,
  );
}
