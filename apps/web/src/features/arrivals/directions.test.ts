import { describe, expect, it } from 'vitest';
import type { ArrivalTiming, BusArrival } from '../../types/domain';
import { groupByDirection } from './directions';

const timing = (minute: number, destinationCode?: string): ArrivalTiming => ({
  estimatedArrival: `2026-10-17T10:${String(minute).padStart(2, '0')}:00+08:00`,
  load: 0,
  isWheelchairAccessible: true,
  type: 0,
  isMonitored: true,
  isLastBus: false,
  destinationCode,
});

const toA = { origin: 'B', destination: 'A', destinationCode: '11111' };
const toB = { origin: 'A', destination: 'B', destinationCode: '22222' };

const service = (routes: BusArrival['routes'], nextBus: ArrivalTiming | null, nextBus2: ArrivalTiming | null, nextBus3: ArrivalTiming | null): BusArrival => ({
  serviceNo: '136',
  operator: 'GAS',
  routes,
  nextBus,
  nextBus2,
  nextBus3,
});

describe('groupByDirection', () => {
  it('splits a service that stops here in both directions into one group per direction', () => {
    const first = timing(5, '11111');
    const second = timing(9, '22222');
    const third = timing(12, '11111');

    const groups = groupByDirection(service([toA, toB], first, second, third));

    expect(groups).toHaveLength(2);
    expect(groups[0].routes).toEqual([toA]);
    expect(groups[0].timings).toEqual([first, third, null]);
    expect(groups[1].routes).toEqual([toB]);
    expect(groups[1].timings).toEqual([second, null, null]);
  });

  it('keeps a direction with no bus due as a group of empty tiles', () => {
    const only = timing(5, '11111');

    const groups = groupByDirection(service([toA, toB], only, null, null));

    expect(groups[1].timings).toEqual([null, null, null]);
  });

  it('keeps one group when the service has a single direction', () => {
    const bus = timing(5, '11111');

    const groups = groupByDirection(service([toA], bus, null, null));

    expect(groups).toEqual([{ routes: [toA], timings: [bus, null, null] }]);
  });

  it('keeps one group when a bus cannot be matched to a direction', () => {
    const matched = timing(5, '11111');
    const unknown = timing(9);

    const groups = groupByDirection(service([toA, toB], matched, unknown, null));

    expect(groups).toEqual([{ routes: [toA, toB], timings: [matched, unknown, null] }]);
  });
});
