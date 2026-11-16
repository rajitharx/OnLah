import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFavouritesStore } from '../src/shared/stores/favouritesStore';
import { useSavedBusesStore } from '../src/shared/stores/savedBusesStore';
import { MAX_FAVOURITES, MAX_SAVED_BUSES } from '../src/shared/utils/limits';
import type { SavedBus } from '../src/shared/utils/savedBuses';

const bus = (stopCode: string, serviceNo: string): SavedBus => ({
  stopCode,
  serviceNo,
  stopName: `Stop ${stopCode}`,
  roadName: 'Victoria St',
  latitude: 1.3,
  longitude: 103.8,
});

// The stores write to storage after the call returns.
const flush = () => new Promise((resolve) => setImmediate(resolve));

// Stands in for closing and reopening the app: memory is wiped, then the stored value is read back.
// Wiping through setState writes the empty value to storage too, so the saved value is put back first.
async function restart(key: string, wipe: () => void, rehydrate: () => void | Promise<void>): Promise<void> {
  await flush();
  const saved = await AsyncStorage.getItem(key);
  wipe();
  await flush();
  if (saved !== null) await AsyncStorage.setItem(key, saved);
  await rehydrate();
}

beforeEach(async () => {
  await AsyncStorage.clear();
  useFavouritesStore.setState({ favourites: [] });
  useSavedBusesStore.setState({ buses: [] });
});

describe('favourites', () => {
  test('adds a stop once, keeps the code as a string and removes it', () => {
    const { add, remove, isFavourite } = useFavouritesStore.getState();
    add({ code: '01012', name: 'Hotel Grand Pacific', road: 'Victoria St' });
    add({ code: '01012', name: 'Hotel Grand Pacific', road: 'Victoria St' });
    expect(useFavouritesStore.getState().favourites).toHaveLength(1);
    expect(useFavouritesStore.getState().favourites[0]?.code).toBe('01012');
    expect(isFavourite('01012')).toBe(true);
    remove('01012');
    expect(isFavourite('01012')).toBe(false);
  });

  test('never holds more than the limit', () => {
    for (let i = 0; i < MAX_FAVOURITES + 3; i += 1) {
      useFavouritesStore.getState().add({ code: String(10000 + i), name: null, road: null });
    }
    expect(useFavouritesStore.getState().favourites.length).toBeLessThanOrEqual(MAX_FAVOURITES);
  });

  test('writes to storage, and a restart reads it back', async () => {
    useFavouritesStore.getState().add({ code: '01012', name: 'Hotel Grand Pacific', road: null });
    await flush();
    expect(await AsyncStorage.getItem('onlah-favourites')).toContain('01012');
    await restart('onlah-favourites', () => useFavouritesStore.setState({ favourites: [] }), () => useFavouritesStore.persist.rehydrate());
    expect(useFavouritesStore.getState().favourites.map((f) => f.code)).toEqual(['01012']);
  });
});

describe('saved buses', () => {
  test('toggle saves a bus, then removes it', () => {
    const { toggle } = useSavedBusesStore.getState();
    expect(toggle(bus('01012', '15'))).toBe(true);
    expect(useSavedBusesStore.getState().buses).toHaveLength(1);
    expect(toggle(bus('01012', '15'))).toBe(true);
    expect(useSavedBusesStore.getState().buses).toHaveLength(0);
  });

  test('the same service at another stop is a different saved bus', () => {
    const { toggle } = useSavedBusesStore.getState();
    toggle(bus('01012', '15'));
    toggle(bus('01013', '15'));
    expect(useSavedBusesStore.getState().buses).toHaveLength(2);
  });

  test('a full list refuses a new bus but still lets a saved one be removed', () => {
    for (let i = 0; i < MAX_SAVED_BUSES; i += 1) useSavedBusesStore.getState().toggle(bus('01012', String(100 + i)));
    expect(useSavedBusesStore.getState().toggle(bus('01012', '999'))).toBe(false);
    expect(useSavedBusesStore.getState().buses).toHaveLength(MAX_SAVED_BUSES);
    expect(useSavedBusesStore.getState().toggle(bus('01012', '100'))).toBe(true);
    expect(useSavedBusesStore.getState().buses).toHaveLength(MAX_SAVED_BUSES - 1);
  });

  test('damaged storage is dropped instead of breaking the Saved tab', async () => {
    await AsyncStorage.setItem(
      'onlah-saved-buses',
      JSON.stringify({ state: { buses: [{ stopCode: 12, nonsense: true }, 'x'] }, version: 1 }),
    );
    await useSavedBusesStore.persist.rehydrate();
    expect(useSavedBusesStore.getState().buses).toEqual([]);
  });

  test('a good saved bus survives a restart', async () => {
    useSavedBusesStore.getState().toggle(bus('01012', '15'));
    await restart('onlah-saved-buses', () => useSavedBusesStore.setState({ buses: [] }), () => useSavedBusesStore.persist.rehydrate());
    expect(useSavedBusesStore.getState().buses.map((b) => `${b.stopCode}/${b.serviceNo}`)).toEqual(['01012/15']);
  });
});
