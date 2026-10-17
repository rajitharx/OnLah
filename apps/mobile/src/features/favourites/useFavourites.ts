import { useFavouritesStore } from '../../shared/stores/favouritesStore';

export function useFavourites() {
  const stopCodes = useFavouritesStore((s) => s.stopCodes);
  const add = useFavouritesStore((s) => s.add);
  const remove = useFavouritesStore((s) => s.remove);
  const reorder = useFavouritesStore((s) => s.reorder);
  const isFavourite = useFavouritesStore((s) => s.isFavourite);

  return { stopCodes, add, remove, reorder, isFavourite };
}
