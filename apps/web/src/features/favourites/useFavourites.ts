import { useState } from 'react';
import { SEED_FAVOURITES } from '../../shared/services/sampleData';

const STORAGE_KEY = 'onlah-web.favourites';
export const MAX_FAVOURITES = 10;

// localStorage can be blocked (private mode, disabled site data), so every access is guarded.
function readFavourites(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return SEED_FAVOURITES;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_FAVOURITES;
    return parsed.filter((code): code is string => typeof code === 'string').slice(0, MAX_FAVOURITES);
  } catch {
    return SEED_FAVOURITES;
  }
}

function writeFavourites(codes: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
  } catch {
    // Storage unavailable: favourites still work for this visit.
  }
}

export interface Favourites {
  codes: string[];
  isFull: boolean;
  has: (code: string) => boolean;
  // Returns false when the list is full and the stop was not added.
  toggle: (code: string) => boolean;
  remove: (code: string) => void;
}

export function useFavourites(): Favourites {
  const [codes, setCodes] = useState<string[]>(readFavourites);

  const update = (next: string[]): void => {
    setCodes(next);
    writeFavourites(next);
  };

  const remove = (code: string): void => update(codes.filter((c) => c !== code));

  const toggle = (code: string): boolean => {
    if (codes.includes(code)) {
      remove(code);
      return true;
    }
    if (codes.length >= MAX_FAVOURITES) return false;
    update([...codes, code]);
    return true;
  };

  return {
    codes,
    isFull: codes.length >= MAX_FAVOURITES,
    has: (code) => codes.includes(code),
    toggle,
    remove,
  };
}
