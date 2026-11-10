import assert from 'node:assert/strict';
import { test } from 'node:test';
import { freshnessText, staleDetail, STALE_TITLE } from '../src/shared/utils/freshness';

const fetchedAt = '2026-11-05T08:00:00.000Z';
const at = (seconds: number): number => Date.parse(fetchedAt) + seconds * 1_000;

test('freshness counts seconds since the fetch', () => {
  assert.equal(freshnessText(fetchedAt, at(12), false), 'Updated 12s ago');
});

test('a stale chip says so in words, so colour is never the only signal', () => {
  assert.equal(freshnessText(fetchedAt, at(90), true), 'Stale · Updated 1m ago');
});

test('the stale notice names the age of the data on screen', () => {
  assert.equal(STALE_TITLE, "Couldn't refresh.");
  assert.equal(staleDetail(fetchedAt, at(45)), 'Showing data from 45s ago.');
});
