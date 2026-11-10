import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_FAVOURITES, MAX_SAVED_BUSES, isNearLimit } from '../src/shared/utils/limits';
import { MAX_SEARCH_RESULTS } from '../src/shared/utils/search';

test('the caps match the web app', () => {
  assert.equal(MAX_FAVOURITES, 10);
  assert.equal(MAX_SAVED_BUSES, 20);
  assert.equal(MAX_SEARCH_RESULTS, 20);
});

test('isNearLimit stays quiet while there is plenty of room', () => {
  assert.equal(isNearLimit(3, 20), false);
  assert.equal(isNearLimit(14, 20), false);
});

test('isNearLimit speaks up when three quarters of the room is used', () => {
  assert.equal(isNearLimit(15, 20), true);
  assert.equal(isNearLimit(8, 10), true);
  assert.equal(isNearLimit(7, 10), false);
});
