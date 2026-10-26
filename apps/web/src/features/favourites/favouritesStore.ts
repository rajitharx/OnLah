import type { BusStop } from '../../types/domain';

// The v2 key stores full stop snapshots, so the list can show names without a lookup.
// The v1 key held bare codes and is ignored.
export const FAVOURITES_KEY = 'onlah-web.favourites.v2';
export const MAX_FAVOURITES = 10;

function isBusStop(value: unknown): value is BusStop {
  if (typeof value !== 'object' || value === null) return false;
  const stop = value as Record<string, unknown>;
  return typeof stop.busStopCode === 'string' && typeof stop.description === 'string' && typeof stop.roadName === 'string';
}

export function parseFavourites(raw: string | null): BusStop[] {
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Hand-edited or merged storage can repeat a stop, which would clash as a React key.
    return parsed.filter(isBusStop).reduce<BusStop[]>(addFavourite, []);
  } catch {
    return [];
  }
}

export function isFavouritesFull(list: BusStop[]): boolean {
  return list.length >= MAX_FAVOURITES;
}

export function addFavourite(list: BusStop[], stop: BusStop): BusStop[] {
  if (list.some((s) => s.busStopCode === stop.busStopCode) || isFavouritesFull(list)) return list;
  return [...list, stop];
}


export function removeFavourite(list: BusStop[], stopCode: string): BusStop[] {
  return list.filter((s) => s.busStopCode !== stopCode);
}
