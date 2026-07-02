import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const MAX_FAVOURITES = 10;

interface FavouritesState {
  stopCodes: string[];
  add: (code: string) => void;
  remove: (code: string) => void;
  reorder: (codes: string[]) => void;
  isFavourite: (code: string) => boolean;
}

export const useFavouritesStore = create<FavouritesState>()(
  persist(
    (set, get) => ({
      stopCodes: [],
      add: (code) => {
        const { stopCodes } = get();
        if (!stopCodes.includes(code) && stopCodes.length < MAX_FAVOURITES) {
          set({ stopCodes: [...stopCodes, code] });
        }
      },
      remove: (code) =>
        set({ stopCodes: get().stopCodes.filter((c) => c !== code) }),
      reorder: (codes) => set({ stopCodes: codes }),
      isFavourite: (code) => get().stopCodes.includes(code),
    }),
    {
      name: 'onlah-favourites',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
