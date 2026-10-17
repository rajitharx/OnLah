import { useState } from 'react';
import type { BusStop } from '../../types/domain';
import { FAVOURITES_KEY, addFavourite, isFavouritesFull, parseFavourites, removeFavourite } from './favouritesStore';

// localStorage can be blocked (private mode, disabled site data), so every access is guarded.
function readFavourites(): BusStop[] {
  try {
    return parseFavourites(window.localStorage.getItem(FAVOURITES_KEY));
  } catch {
    return [];
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

export function useFavourites(): Favourites {
  const [stops, setStops] = useState<BusStop[]>(readFavourites);

  const update = (next: BusStop[]): void => {
    setStops(next);
    writeFavourites(next);
  };

  const toggle = (stop: BusStop): boolean => {
    if (stops.some((s) => s.busStopCode === stop.busStopCode)) {
      update(removeFavourite(stops, stop.busStopCode));
      return true;
    }
    if (isFavouritesFull(stops)) return false;
    update(addFavourite(stops, stop));
    return true;
  };

  return {
    stops,
    isFull: isFavouritesFull(stops),
    has: (stopCode) => stops.some((s) => s.busStopCode === stopCode),
    toggle,
    remove: (stopCode) => update(removeFavourite(stops, stopCode)),
  };
}
