import type { BusStop } from '../../types/domain';

export interface FavouriteStop {
  code: string;
  // null until the stop's details are known; entries saved before names were stored start this way.
  name: string | null;
  road: string | null;
}

export interface PersistedFavourites {
  favourites: FavouriteStop[];
}

export const FAVOURITES_VERSION = 1;

function isFavouriteStop(value: unknown): value is FavouriteStop {
  if (typeof value !== 'object' || value === null) return false;
  const { code, name, road } = value as Record<string, unknown>;
  return (
    typeof code === 'string' &&
    (typeof name === 'string' || name === null) &&
    (typeof road === 'string' || road === null)
  );
}

export function migrateFavourites(persisted: unknown, version: number): PersistedFavourites {
  const state = (typeof persisted === 'object' && persisted !== null ? persisted : {}) as Record<
    string,
    unknown
  >;
  if (version === 0) {
    const codes = Array.isArray(state.stopCodes) ? state.stopCodes : [];
    return {
      favourites: codes
        .filter((code): code is string => typeof code === 'string')
        .map((code) => ({ code, name: null, road: null })),
    };
  }
  const favourites = Array.isArray(state.favourites) ? state.favourites : [];
  return { favourites: favourites.filter(isFavouriteStop) };
}

export function upsertFavourite(
  favourites: FavouriteStop[],
  stop: FavouriteStop,
  max: number,
): FavouriteStop[] {
  if (favourites.some((f) => f.code === stop.code)) {
    return favourites.map((f) => (f.code === stop.code ? stop : f));
  }
  return favourites.length < max ? [...favourites, stop] : favourites;
}

export function findStopByCode(stops: BusStop[], code: string): FavouriteStop | null {
  const match = stops.find((s) => s.busStopCode === code);
  return match ? { code, name: match.description, road: match.roadName } : null;
}
