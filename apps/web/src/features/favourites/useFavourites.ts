import { useEffect, useState } from 'react';
import type { BusStop } from '../../types/domain';
import {
  FAVOURITES_KEY,
  addFavourite,
  isFavouritesFull,
  parseFavourites,
  removeFavourite,
} from './favouritesStore';

// localStorage can be blocked (private mode, disabled site data), so every access is guarded.
// null means storage could not be read, so the caller keeps the list it has in memory.
function readFavourites(): BusStop[] | null {
  try {
    return parseFavourites(window.localStorage.getItem(FAVOURITES_KEY));
  } catch {
    return null;
  }
}

function writeFavourites(list: BusStop[]): void {
  try {
    window.localStorage.setItem(FAVOURITES_KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable: favourites still work for this visit.
  }
}

export interface Favourites {
  stops: BusStop[];
  isFull: boolean;
  has: (stopCode: string) => boolean;
  // Returns false when the list is full and the stop was not added.
  toggle: (stop: BusStop) => boolean;
  remove: (stopCode: string) => void;
}

// Another tab can change the list, so it reloads on the storage event and every change starts from what is stored.
export function useFavourites(): Favourites {
  const [stops, setStops] = useState<BusStop[]>(() => readFavourites() ?? []);

  useEffect(() => {
    const onStorage = (event: StorageEvent): void => {
      if (event.key === FAVOURITES_KEY || event.key === null) setStops(readFavourites() ?? []);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const save = (next: BusStop[]): void => {
    setStops(next);
    writeFavourites(next);
  };
  const current = (): BusStop[] => readFavourites() ?? stops;

  const toggle = (stop: BusStop): boolean => {
    const list = current();
    if (list.some((s) => s.busStopCode === stop.busStopCode)) {
      save(removeFavourite(list, stop.busStopCode));
      return true;
    }
    if (isFavouritesFull(list)) {
      setStops(list);
      return false;
    }
    save(addFavourite(list, stop));
    return true;
  };

  return {
    stops,
    isFull: isFavouritesFull(stops),
    has: (stopCode) => stops.some((s) => s.busStopCode === stopCode),
    toggle,
    remove: (stopCode) => save(removeFavourite(current(), stopCode)),
  };
}
