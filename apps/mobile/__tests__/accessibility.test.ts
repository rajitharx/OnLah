import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ArrivalTiming, BusArrival } from '../src/types/domain';
import {
  buildArrivalLabel,
  buildFavouriteCardLabel,
  buildFavouriteLabel,
} from '../src/shared/utils/accessibility';

const now = Date.parse('2026-01-01T08:00:00Z');

function timing(mins: number, overrides: Partial<ArrivalTiming> = {}): ArrivalTiming {
  return {
    estimatedArrival: new Date(now + mins * 60_000 + 5_000).toISOString(),
    load: 0,
    isWheelchairAccessible: false,
    type: 0,
    isMonitored: true,
    isLastBus: false,
    ...overrides,
  };
}

function arrival(nextBus: ArrivalTiming | null, nextBus2: ArrivalTiming | null = null): BusArrival {
  return { serviceNo: '12', operator: 'SBST', nextBus, nextBus2, nextBus3: null, routes: [] };
}

test('combines service, eta, crowd, accessibility and following bus', () => {
  const label = buildArrivalLabel(
    arrival(timing(5, { isWheelchairAccessible: true }), timing(8)),
    now,
  );
  assert.equal(
    label,
    'Bus 12, 5 minutes, seats available, wheelchair accessible, then 8 minutes',
  );
});

test('speaks arriving buses and singular minutes', () => {
  assert.equal(
    buildArrivalLabel(arrival(timing(0), timing(1)), now),
    'Bus 12, arriving now, seats available, then 1 minute',
  );
});

test('maps crowd levels to spoken text', () => {
  assert.match(buildArrivalLabel(arrival(timing(3, { load: 1 })), now), /standing available/);
  assert.match(buildArrivalLabel(arrival(timing(3, { load: 2 })), now), /limited standing/);
});

test('flags scheduled, unmonitored buses', () => {
  assert.match(
    buildArrivalLabel(arrival(timing(3, { isMonitored: false })), now),
    /scheduled time, not live/,
  );
});

test('reports no service when there is no next bus', () => {
  assert.equal(buildArrivalLabel(arrival(null), now), 'Bus 12, no service');
});

test('favourite label reflects saved state', () => {
  assert.equal(buildFavouriteLabel(true), 'Remove stop from favourites');
  assert.equal(buildFavouriteLabel(false), 'Add stop to favourites');
});

test('favourite card speaks the stop name, its action and the arrivals shown on it', () => {
  assert.equal(
    buildFavouriteCardLabel({ code: '01012', name: 'Hotel Grand Pacific' }, [
      'Bus 12, 5 minutes, seats available',
      'Bus 7, arriving now, limited standing',
    ]),
    'Hotel Grand Pacific, open arrivals. Bus 12, 5 minutes, seats available. Bus 7, arriving now, limited standing',
  );
});

test('favourite card falls back to the stop code when the name is unknown', () => {
  assert.equal(buildFavouriteCardLabel({ code: '01012', name: null }, []), 'Stop 01012, open arrivals');
});
