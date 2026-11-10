import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SLOW_LOAD_MS, SLOW_LOAD_MESSAGE, isSlowLoad } from '../src/features/arrivals/arrivalsState';

test('a first load is slow only after 3 seconds', () => {
  assert.equal(isSlowLoad(SLOW_LOAD_MS - 1), false);
  assert.equal(isSlowLoad(SLOW_LOAD_MS), true);
});

test('the slow message says the server is waking up', () => {
  assert.equal(SLOW_LOAD_MESSAGE, 'Waking up the server… the first load can take up to a minute.');
});
