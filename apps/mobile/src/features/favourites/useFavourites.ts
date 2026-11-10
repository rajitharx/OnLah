import { useEffect, useState } from 'react';
import { searchBusStops } from '../../shared/services/onlahApi';
import { useFavouritesStore } from '../../shared/stores/favouritesStore';
import { FavouriteStop, findStopByCode } from '../../shared/utils/favourites';

export function useFavourites() {
  const favourites = useFavouritesStore((s) => s.favourites);
  const add = useFavouritesStore((s) => s.add);
  const remove = useFavouritesStore((s) => s.remove);
  const reorder = useFavouritesStore((s) => s.reorder);
  const isFavourite = useFavouritesStore((s) => s.isFavourite);

  return { favourites, add, remove, reorder, isFavourite };
}

export function useStopDetailsBackfill(stop: FavouriteStop): void {
  const add = useFavouritesStore((s) => s.add);
  const needsLookup = stop.name === null;

  useEffect(() => {
    if (!needsLookup) return;
    searchBusStops(stop.code)
      .then((results) => {
        const found = findStopByCode(results, stop.code);
        if (found && useFavouritesStore.getState().isFavourite(stop.code)) add(found);
      })
      .catch(() => {});
  }, [needsLookup, stop.code, add]);
}

// The saved list loads from the phone a moment after launch. This says when it has.
export function useFavouritesHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useFavouritesStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = useFavouritesStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useFavouritesStore.persist.hasHydrated());
    return unsubscribe;
  }, []);

  return hydrated;
}
