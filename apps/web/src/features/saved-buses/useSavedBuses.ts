import { useState } from 'react';
import {
  SAVED_BUSES_KEY,
  addSavedBus,
  hasSavedBus,
  isSavedBusesFull,
  parseSavedBuses,
  removeSavedBus,
  type SavedBus,
} from './savedBusesStore';

// localStorage can be blocked (private mode, disabled site data), so every access is guarded.
function readSavedBuses(): SavedBus[] {
  try {
    return parseSavedBuses(window.localStorage.getItem(SAVED_BUSES_KEY));
  } catch {
    return [];
  }
}

function writeSavedBuses(list: SavedBus[]): void {
  try {
    window.localStorage.setItem(SAVED_BUSES_KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable: saved buses still work for this visit.
  }
}

export interface SavedBuses {
  buses: SavedBus[];
  isFull: boolean;
  has: (stopCode: string, serviceNo: string) => boolean;
  // Saves the bus, or removes it when already saved. Returns false when the list is full and the bus was not added.
  toggle: (bus: SavedBus) => boolean;
  remove: (stopCode: string, serviceNo: string) => void;
}

export function useSavedBuses(): SavedBuses {
  const [buses, setBuses] = useState<SavedBus[]>(readSavedBuses);

  const update = (next: SavedBus[]): void => {
    setBuses(next);
    writeSavedBuses(next);
  };

  const toggle = (bus: SavedBus): boolean => {
    if (hasSavedBus(buses, bus.stopCode, bus.serviceNo)) {
      update(removeSavedBus(buses, bus.stopCode, bus.serviceNo));
      return true;
    }
    if (isSavedBusesFull(buses)) return false;
    update(addSavedBus(buses, bus));
    return true;
  };

  return {
    buses,
    isFull: isSavedBusesFull(buses),
    has: (stopCode, serviceNo) => hasSavedBus(buses, stopCode, serviceNo),
    toggle,
    remove: (stopCode, serviceNo) => update(removeSavedBus(buses, stopCode, serviceNo)),
  };
}
