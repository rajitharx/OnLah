import { describe, expect, it } from 'vitest';
import type { ArrivalTiming, BusArrivalsResponse } from '../../types/domain';
import { collectDeckTypes, formatFrequency, formatHours, summarizeDeckTypes } from './serviceDetails';

describe('formatHours', () => {
  it('shows a published range as two times', () => {
    expect(formatHours({ first: '05:30', last: '23:30' })).toBe('05:30 to 23:30');
  });

  it('says so when LTA has no time for the day', () => {
    expect(formatHours(null)).toBe('Not published');
  });
});

describe('formatFrequency', () => {
  it('turns a two-digit range into plain minutes', () => {
    expect(formatFrequency('09-13')).toBe('9 to 13 min');
  });

  it('keeps a single-digit range readable', () => {
    expect(formatFrequency('9-11')).toBe('9 to 11 min');
  });

  it('shows a missing frequency as not published', () => {
    expect(formatFrequency(null)).toBe('Not published');
  });

  it('shows an unrecognised value as it was published', () => {
    expect(formatFrequency('Every 10 min')).toBe('Every 10 min');
  });
});

describe('summarizeDeckTypes', () => {
  it('says so when no deck type is in the current arrivals', () => {
    expect(summarizeDeckTypes([])).toBe('No deck type seen right now');
  });

  it('names one deck type', () => {
    expect(summarizeDeckTypes([0])).toBe('Single deck');
    expect(summarizeDeckTypes([1])).toBe('Double deck');
  });

  it('names both single and double deck when both are seen', () => {
    expect(summarizeDeckTypes([0, 1])).toBe('Single deck and double deck');
  });

  it('lists three types with commas and a final and', () => {
    expect(summarizeDeckTypes([0, 1, 2])).toBe('Single deck, double deck and bendy');
  });
});

describe('collectDeckTypes', () => {
  const timing = (type: 0 | 1 | 2): ArrivalTiming => ({
    estimatedArrival: '2026-10-18T07:10:00+08:00',
    load: 0,
    isWheelchairAccessible: false,
    type,
    isMonitored: true,
  });

  const arrivals: BusArrivalsResponse = {
    stopCode: '01012',
    fetchedAt: '2026-10-18T07:00:00Z',
    services: [
      { serviceNo: '102', operator: 'SBST', nextBus: timing(0), nextBus2: timing(1), nextBus3: null },
      { serviceNo: '15', operator: 'SBST', nextBus: timing(2), nextBus2: null, nextBus3: null },
    ],
  };

  it('collects the deck types of one service, sorted and without repeats', () => {
    expect(collectDeckTypes(arrivals, '102')).toEqual([0, 1]);
  });

  it('returns nothing when there is no board data', () => {
    expect(collectDeckTypes(null, '102')).toEqual([]);
  });

  it('returns nothing for a service that is not in the arrivals', () => {
    expect(collectDeckTypes(arrivals, '999')).toEqual([]);
  });
});
