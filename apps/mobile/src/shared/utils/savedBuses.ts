// A saved bus is one service at one stop. The same service number at another stop is a different bus.
// The stop's name and position are stored with it, so the saved list shows them without a lookup.
import { MAX_SAVED_BUSES } from './limits';

export const SAVED_BUSES_VERSION = 1;

export interface SavedBus {
  stopCode: string;
  serviceNo: string;
  stopName: string;
  roadName: string;
  latitude: number;
  longitude: number;
}

export interface PersistedSavedBuses {
  buses: SavedBus[];
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

export function isSavedBusesFull(list: SavedBus[]): boolean {
  return list.length >= MAX_SAVED_BUSES;
}

export function hasSavedBus(list: SavedBus[], stopCode: string, serviceNo: string): boolean {
  return list.some((bus) => bus.stopCode === stopCode && bus.serviceNo === serviceNo);
}

// Adds the bus unless it is already saved or the list is full.
export function addSavedBus(list: SavedBus[], bus: SavedBus): SavedBus[] {
  if (hasSavedBus(list, bus.stopCode, bus.serviceNo) || isSavedBusesFull(list)) return list;
  return [...list, bus];
}

export function removeSavedBus(list: SavedBus[], stopCode: string, serviceNo: string): SavedBus[] {
  return list.filter((bus) => !(bus.stopCode === stopCode && bus.serviceNo === serviceNo));
}

// Stored data can be damaged or repeat a bus, which would clash as a list key. Invalid entries are dropped.
export function parseSavedBuses(persisted: unknown): PersistedSavedBuses {
  const state = (typeof persisted === 'object' && persisted !== null ? persisted : {}) as Record<string, unknown>;
  const stored = Array.isArray(state.buses) ? state.buses : [];
  return { buses: stored.filter(isSavedBus).reduce<SavedBus[]>(addSavedBus, []) };
}
