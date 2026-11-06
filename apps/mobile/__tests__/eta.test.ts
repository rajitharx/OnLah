import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatEta, formatFreshness, isStale } from '../src/shared/utils/eta';

const fetchedAt = '2026-11-05T08:00:00.000Z';
const at = (seconds: number): number => Date.parse(fetchedAt) + seconds * 1_000;

test('freshness counts up from the fetch time on the supplied clock', () => {
  assert.equal(formatFreshness(fetchedAt, at(0)), 'Updated 0s ago');
  assert.equal(formatFreshness(fetchedAt, at(17)), 'Updated 17s ago');
  assert.equal(formatFreshness(fetchedAt, at(125)), 'Updated 2m ago');
});

test('freshness never reads negative when the clock trails the fetch time', () => {
  assert.equal(formatFreshness(fetchedAt, at(-3)), 'Updated 0s ago');
});

test('data turns stale once it is older than 40 seconds', () => {
  assert.equal(isStale(fetchedAt, at(40)), false);
  assert.equal(isStale(fetchedAt, at(41)), true);
});

test('ETA minutes count down as the clock moves', () => {
  const arrival = '2026-11-05T08:05:30.000Z';
  assert.equal(formatEta(arrival, at(0)), '5');
  assert.equal(formatEta(arrival, at(150)), '3');
  assert.equal(formatEta(arrival, at(300)), 'Arr');
});
