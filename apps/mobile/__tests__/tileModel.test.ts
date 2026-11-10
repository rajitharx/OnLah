import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tileLabel, tileSpokenLabel } from '../src/features/arrivals/tileModel';
import type { ArrivalTiming } from '../src/types/domain';

const NOW = Date.parse('2026-11-10T00:00:00Z');
function timing(minutes: number, extra: Partial<ArrivalTiming> = {}): ArrivalTiming {
  return {
    estimatedArrival: new Date(NOW + minutes * 60_000).toISOString(),
    load: 0,
    isWheelchairAccessible: true,
    type: 1,
    isMonitored: true,
    isLastBus: false,
    ...extra,
  };
}

test('tileLabel shows Arr under a minute and whole minutes otherwise', () => {
  assert.deepEqual(tileLabel(timing(0), NOW), { value: 'Arr', unit: null });
  assert.deepEqual(tileLabel(timing(7), NOW), { value: '7', unit: 'min' });
});

test('tileSpokenLabel names time, crowd, deck, access and last bus', () => {
  assert.equal(tileSpokenLabel(timing(7), NOW), '7 minutes, Seats, Double, wheelchair accessible');
  assert.equal(
    tileSpokenLabel(timing(0, { isWheelchairAccessible: false, isLastBus: true, load: 2, type: 0 }), NOW),
    'Arriving, Crowded, Single, not wheelchair accessible, last bus',
  );
  assert.equal(tileSpokenLabel(null, NOW), 'No bus due');
});
