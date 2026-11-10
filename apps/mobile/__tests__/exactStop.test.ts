import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findExactStop } from '../src/shared/utils/favourites';
import type { BusStop } from '../src/types/domain';

function stop(code: string): BusStop {
  return { busStopCode: code, roadName: 'Rd', description: `Stop ${code}`, latitude: 1, longitude: 2, distanceMeters: 0 };
}

test('findExactStop picks the stop whose code matches, never a near match', () => {
  const results = [stop('01013'), stop('01012')];
  assert.equal(findExactStop(results, '01012')?.busStopCode, '01012');
  assert.equal(findExactStop(results, '99999'), null);
  assert.equal(findExactStop([], '01012'), null);
});
