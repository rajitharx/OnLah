import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  FAVOURITES_VERSION,
  FavouriteStop,
  migrateFavourites,
  upsertFavourite,
} from '../utils/favourites';

const MAX_FAVOURITES = 10;

interface FavouritesState {
  favourites: FavouriteStop[];
  add: (stop: FavouriteStop) => void;
  remove: (code: string) => void;
  reorder: (favourites: FavouriteStop[]) => void;
  isFavourite: (code: string) => boolean;
}

export const useFavouritesStore = create<FavouritesState>()(
  persist(
    (set, get) => ({
      favourites: [],
      add: (stop) =>
        set({ favourites: upsertFavourite(get().favourites, stop, MAX_FAVOURITES) }),
      remove: (code) =>
        set({ favourites: get().favourites.filter((f) => f.code !== code) }),
      reorder: (favourites) => set({ favourites }),
      isFavourite: (code) => get().favourites.some((f) => f.code === code),
    }),
    {
      name: 'onlah-favourites',
      storage: createJSONStorage(() => AsyncStorage),
      version: FAVOURITES_VERSION,
      migrate: migrateFavourites,
      partialize: (state) => ({ favourites: state.favourites }),
    },
  ),
);
