import { useEffect, useState } from 'react';
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
// null means storage could not be read, so the caller keeps the list it has in memory.
function readSavedBuses(): SavedBus[] | null {
  try {
    return parseSavedBuses(window.localStorage.getItem(SAVED_BUSES_KEY));
  } catch {
    return null;
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

// Another tab can change the list, so it reloads on the storage event and every change starts from what is stored.
export function useSavedBuses(): SavedBuses {
  const [buses, setBuses] = useState<SavedBus[]>(() => readSavedBuses() ?? []);

  useEffect(() => {
    const onStorage = (event: StorageEvent): void => {
      if (event.key === SAVED_BUSES_KEY || event.key === null) setBuses(readSavedBuses() ?? []);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const save = (next: SavedBus[]): void => {
    setBuses(next);
    writeSavedBuses(next);
  };
  const current = (): SavedBus[] => readSavedBuses() ?? buses;

  const toggle = (bus: SavedBus): boolean => {
    const list = current();
    if (hasSavedBus(list, bus.stopCode, bus.serviceNo)) {
      save(removeSavedBus(list, bus.stopCode, bus.serviceNo));
      return true;
    }
    if (isSavedBusesFull(list)) {
      setBuses(list);
      return false;
    }
    save(addSavedBus(list, bus));
    return true;
  };

  return {
    buses,
    isFull: isSavedBusesFull(buses),
    has: (stopCode, serviceNo) => hasSavedBus(buses, stopCode, serviceNo),
    toggle,
    remove: (stopCode, serviceNo) => save(removeSavedBus(current(), stopCode, serviceNo)),
  };
}
