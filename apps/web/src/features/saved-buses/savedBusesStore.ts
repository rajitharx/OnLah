// A saved bus is one service at one stop. The same service number at another stop is a different bus.
// Names are stored with the bus so the saved list can show them without a lookup.
export const SAVED_BUSES_KEY = 'onlah-web.saved-buses.v1';
export const MAX_SAVED_BUSES = 20;

export interface SavedBus {
  stopCode: string;
  serviceNo: string;
  stopName: string;
  roadName: string;
  latitude: number;
  longitude: number;
}

function isSavedBus(value: unknown): value is SavedBus {
  if (typeof value !== 'object' || value === null) return false;
  const bus = value as Record<string, unknown>;
  return (
    typeof bus.stopCode === 'string' &&
    typeof bus.serviceNo === 'string' &&
    typeof bus.stopName === 'string' &&
    typeof bus.roadName === 'string' &&
    typeof bus.latitude === 'number' &&
    typeof bus.longitude === 'number'
  );
}

export function parseSavedBuses(raw: string | null): SavedBus[] {
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedBus).slice(0, MAX_SAVED_BUSES);
  } catch {
    return [];
  }
}

export function isSavedBusesFull(list: SavedBus[]): boolean {
  return list.length >= MAX_SAVED_BUSES;
}

export function hasSavedBus(list: SavedBus[], stopCode: string, serviceNo: string): boolean {
  return list.some((bus) => bus.stopCode === stopCode && bus.serviceNo === serviceNo);
}

export function addSavedBus(list: SavedBus[], bus: SavedBus): SavedBus[] {
  if (hasSavedBus(list, bus.stopCode, bus.serviceNo) || isSavedBusesFull(list)) return list;
  return [...list, bus];
}

export function removeSavedBus(list: SavedBus[], stopCode: string, serviceNo: string): SavedBus[] {
  return list.filter((bus) => !(bus.stopCode === stopCode && bus.serviceNo === serviceNo));
}
