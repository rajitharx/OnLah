import type { BusArrival, BusArrivalsResponse, BusStop } from '../../types/domain';
import type { SavedBus } from './savedBusesStore';

export interface SavedStopGroup {
  stopCode: string;
  stopName: string;
  roadName: string;
  latitude: number;
  longitude: number;
  serviceNos: string[];
}

export interface SavedServiceRow {
  serviceNo: string;
  // Null when the stop returned no row for this service, for example before the first load.
  service: BusArrival | null;
}

export function hasBusesDue(service: BusArrival | null): boolean {
  if (service === null) return false;
  return service.nextBus !== null || service.nextBus2 !== null || service.nextBus3 !== null;
}

// One group per stop, in the order the stops were first saved.
export function groupByStop(saved: SavedBus[]): SavedStopGroup[] {
  const groups = new Map<string, SavedStopGroup>();
  for (const bus of saved) {
    const group = groups.get(bus.stopCode) ?? {
      stopCode: bus.stopCode,
      stopName: bus.stopName,
      roadName: bus.roadName,
      latitude: bus.latitude,
      longitude: bus.longitude,
      serviceNos: [],
    };
    group.serviceNos.push(bus.serviceNo);
    groups.set(bus.stopCode, group);
  }
  return [...groups.values()];
}

// Opening a saved stop reuses the board, which takes a full stop.
export function toBusStop(group: SavedStopGroup): BusStop {
  return {
    busStopCode: group.stopCode,
    description: group.stopName,
    roadName: group.roadName,
    latitude: group.latitude,
    longitude: group.longitude,
    distanceMeters: 0,
  };
}

export function pickSavedServices(
  arrivals: BusArrivalsResponse | null,
  serviceNos: string[],
): SavedServiceRow[] {
  return serviceNos.map((serviceNo) => ({
    serviceNo,
    service: arrivals?.services.find((row) => row.serviceNo === serviceNo) ?? null,
  }));
}
