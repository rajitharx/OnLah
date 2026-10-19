import { describe, expect, it } from 'vitest';
import {
  MAX_SAVED_BUSES,
  addSavedBus,
  hasSavedBus,
  isSavedBusesFull,
  parseSavedBuses,
  removeSavedBus,
  type SavedBus,
} from './savedBusesStore';

const bus = (stopCode: string, serviceNo: string): SavedBus => ({
  stopCode,
  serviceNo,
  stopName: `Stop ${stopCode}`,
  roadName: 'Victoria St',
  latitude: 1.29,
  longitude: 103.85,
});

describe('parseSavedBuses', () => {
  it('returns an empty list when nothing is stored', () => {
    expect(parseSavedBuses(null)).toEqual([]);
  });

  it('returns an empty list when the stored value is not JSON', () => {
    expect(parseSavedBuses('{not json')).toEqual([]);
  });

  it('drops entries that are not saved buses', () => {
    const raw = JSON.stringify(['01012/12', bus('01012', '12'), { stopCode: 1, serviceNo: '12' }]);

    expect(parseSavedBuses(raw)).toEqual([bus('01012', '12')]);
  });

  it('keeps at most MAX_SAVED_BUSES entries', () => {
    const raw = JSON.stringify(Array.from({ length: MAX_SAVED_BUSES + 4 }, (_, i) => bus('01012', String(i))));

    expect(parseSavedBuses(raw)).toHaveLength(MAX_SAVED_BUSES);
  });
});

describe('addSavedBus', () => {
  it('appends a bus that is not saved yet', () => {
    expect(addSavedBus([bus('01012', '12')], bus('01012', '14'))).toEqual([bus('01012', '12'), bus('01012', '14')]);
  });

  it('treats the same service at a different stop as a different bus', () => {
    expect(addSavedBus([bus('01012', '12')], bus('03111', '12'))).toHaveLength(2);
  });

  it('does not add a bus that is already saved', () => {
    const list = [bus('01012', '12')];

    expect(addSavedBus(list, bus('01012', '12'))).toBe(list);
  });

  it('does not add a bus when the list is full', () => {
    const full = Array.from({ length: MAX_SAVED_BUSES }, (_, i) => bus('01012', String(i)));

    expect(addSavedBus(full, bus('01012', 'new'))).toBe(full);
  });
});

describe('removeSavedBus', () => {
  it('removes only the bus at that stop', () => {
    const list = [bus('01012', '12'), bus('03111', '12')];

    expect(removeSavedBus(list, '01012', '12')).toEqual([bus('03111', '12')]);
  });
});

describe('hasSavedBus and isSavedBusesFull', () => {
  it('finds a saved bus by stop and service', () => {
    const list = [bus('01012', '12')];

    expect(hasSavedBus(list, '01012', '12')).toBe(true);
    expect(hasSavedBus(list, '03111', '12')).toBe(false);
  });

  it('reports full at the cap', () => {
    const list = Array.from({ length: MAX_SAVED_BUSES }, (_, i) => bus('01012', String(i)));

    expect(isSavedBusesFull(list)).toBe(true);
    expect(isSavedBusesFull(list.slice(1))).toBe(false);
  });
});
