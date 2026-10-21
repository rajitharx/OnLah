import { describe, expect, it } from 'vitest';
import type { ArrivalTiming, BusArrival, BusArrivalsResponse } from '../../types/domain';
import { busAdvisories } from './busAdvisories';

const timing: ArrivalTiming = {
  estimatedArrival: '2026-10-17T10:05:00+08:00',
  load: 0,
  isWheelchairAccessible: false,
  type: 0,
  isMonitored: true,
  isLastBus: false,
};

const service = (serviceNo: string, nextBus: ArrivalTiming | null): BusArrival => ({
  serviceNo,
  operator: 'SBST',
  nextBus,
  nextBus2: null,
  nextBus3: null,
});

const response = (services: BusArrival[]): BusArrivalsResponse => ({
  stopCode: '01012',
  fetchedAt: '2026-10-17T10:00:00Z',
  services,
});

describe('busAdvisories', () => {
  it('returns no advisories when every service has buses due', () => {
    expect(busAdvisories(response([service('15', timing)]))).toEqual([]);
  });

  it('reports a stop with no services', () => {
    expect(busAdvisories(response([]))).toEqual([
      { kind: 'stop-quiet', message: 'No bus times for this stop right now. Buses may not be running, or the data is unavailable.' },
    ]);
  });

  it('reports a service that has no buses due, keeping its number', () => {
    expect(busAdvisories(response([service('166', null)]))).toEqual([
      { kind: 'service-no-buses', serviceNo: '166', message: 'Service 166 has no buses due.' },
    ]);
  });

  it('reports only the empty services and keeps the order of the response', () => {
    const advisories = busAdvisories(response([service('15', timing), service('166', null), service('51', null)]));

    expect(advisories.map((a) => (a.kind === 'service-no-buses' ? a.serviceNo : a.kind))).toEqual(['166', '51']);
  });

  it('does not report a service that has a later bus but no next bus', () => {
    const laterOnly: BusArrival = { serviceNo: '65', operator: 'SBST', nextBus: null, nextBus2: timing, nextBus3: null };

    expect(busAdvisories(response([laterOnly]))).toEqual([]);
  });
});
