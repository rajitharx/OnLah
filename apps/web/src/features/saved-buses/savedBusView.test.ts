import { describe, expect, it } from 'vitest';
import type { BusArrival, BusArrivalsResponse } from '../../types/domain';
import type { SavedBus } from './savedBusesStore';
import { groupByStop, hasBusesDue, pickSavedServices, toBusStop } from './savedBusView';

const bus = (stopCode: string, serviceNo: string): SavedBus => ({
  stopCode,
  serviceNo,
  stopName: `Stop ${stopCode}`,
  roadName: 'Victoria St',
  latitude: 1.29,
  longitude: 103.85,
});

const service = (serviceNo: string): BusArrival => ({
  serviceNo,
  operator: 'SBST',
  routes: [],
  nextBus: null,
  nextBus2: null,
  nextBus3: null,
});

const arrivals = (services: BusArrival[]): BusArrivalsResponse => ({
  stopCode: '01012',
  fetchedAt: '2026-10-19T10:00:00Z',
  services,
});

describe('groupByStop', () => {
  it('groups services under their stop in first-saved order', () => {
    const groups = groupByStop([bus('03111', '12'), bus('01012', '14'), bus('03111', '2')]);

    expect(groups).toEqual([
      {
        stopCode: '03111',
        stopName: 'Stop 03111',
        roadName: 'Victoria St',
        latitude: 1.29,
        longitude: 103.85,
        serviceNos: ['12', '2'],
      },
      {
        stopCode: '01012',
        stopName: 'Stop 01012',
        roadName: 'Victoria St',
        latitude: 1.29,
        longitude: 103.85,
        serviceNos: ['14'],
      },
    ]);
  });

  it('returns no groups for no saved buses', () => {
    expect(groupByStop([])).toEqual([]);
  });
});

describe('toBusStop', () => {
  it('rebuilds the stop a saved group was saved from', () => {
    const [group] = groupByStop([bus('01012', '12')]);

    expect(toBusStop(group)).toEqual({
      busStopCode: '01012',
      description: 'Stop 01012',
      roadName: 'Victoria St',
      latitude: 1.29,
      longitude: 103.85,
      distanceMeters: 0,
    });
  });
});

describe('pickSavedServices', () => {
  it('returns the saved services in saved order, using the live row when present', () => {
    const live = arrivals([service('14'), service('12')]);

    expect(pickSavedServices(live, ['12', '14']).map((row) => row.serviceNo)).toEqual(['12', '14']);
    expect(pickSavedServices(live, ['12'])[0].service).toEqual(service('12'));
  });

  it('marks a saved service with no live row as missing', () => {
    expect(pickSavedServices(arrivals([service('14')]), ['12'])).toEqual([{ serviceNo: '12', service: null }]);
  });

  it('marks every saved service as missing before the first load', () => {
    expect(pickSavedServices(null, ['12'])).toEqual([{ serviceNo: '12', service: null }]);
  });
});

describe('hasBusesDue', () => {
  it('is false when there is no row or no timing', () => {
    expect(hasBusesDue(null)).toBe(false);
    expect(hasBusesDue(service('12'))).toBe(false);
  });

  it('is true when any of the next three buses is listed', () => {
    const later: BusArrival = { ...service('12'), nextBus3: { estimatedArrival: '2026-10-19T10:09:00Z', load: 0, isWheelchairAccessible: false, type: 0, isMonitored: true, isLastBus: false } };

    expect(hasBusesDue(later)).toBe(true);
  });
});
