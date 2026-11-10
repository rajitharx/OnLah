import { sortByDistance } from '../../shared/utils/haversine';
import type { BusStop } from '../../types/domain';

// 1 km, the same as the web bus board.
export const NEARBY_RADIUS_M = 1_000;
export const NEARBY_RADIUS_KM = NEARBY_RADIUS_M / 1_000;

export function nearbyStopsSorted(stops: BusStop[]): BusStop[] {
  return sortByDistance(stops);
}
