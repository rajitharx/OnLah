import { useEffect } from 'react';
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
