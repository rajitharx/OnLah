import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  SAVED_BUSES_VERSION,
  addSavedBus,
  hasSavedBus,
  isSavedBusesFull,
  parseSavedBuses,
  removeSavedBus,
  type SavedBus,
} from '../utils/savedBuses';

interface SavedBusesState {
  buses: SavedBus[];
  // Saves the bus, or removes it when already saved. Returns false when the list is full and the bus was not added.
  toggle: (bus: SavedBus) => boolean;
  remove: (stopCode: string, serviceNo: string) => void;
}

export const useSavedBusesStore = create<SavedBusesState>()(
  persist(
    (set, get) => ({
      buses: [],
      toggle: (bus) => {
        const list = get().buses;
        if (hasSavedBus(list, bus.stopCode, bus.serviceNo)) {
          set({ buses: removeSavedBus(list, bus.stopCode, bus.serviceNo) });
          return true;
        }
        if (isSavedBusesFull(list)) return false;
        set({ buses: addSavedBus(list, bus) });
        return true;
      },
      remove: (stopCode, serviceNo) => set({ buses: removeSavedBus(get().buses, stopCode, serviceNo) }),
    }),
    {
      name: 'onlah-saved-buses',
      storage: createJSONStorage(() => AsyncStorage),
      version: SAVED_BUSES_VERSION,
      // Anything read back is checked again, so damaged storage cannot break the Saved tab.
      migrate: (persisted) => parseSavedBuses(persisted),
      merge: (persisted, current) => ({ ...current, ...parseSavedBuses(persisted) }),
      partialize: (state) => ({ buses: state.buses }),
    },
  ),
);
