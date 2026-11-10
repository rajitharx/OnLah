import assert from 'node:assert/strict';
import { test } from 'node:test';
import { defaultTab, savedStopsCaption } from '../src/features/favourites/savedTab';

test('the app opens on Saved when anything is saved, otherwise on Search', () => {
  assert.equal(defaultTab(true), 'SavedTab');
  assert.equal(defaultTab(false), 'SearchTab');
});

test('the saved stops caption appears only near the cap', () => {
  assert.equal(savedStopsCaption(0), null);
  assert.equal(savedStopsCaption(7), null);
  assert.equal(savedStopsCaption(8), '8 of 10 stops saved on this device');
  assert.equal(savedStopsCaption(10), '10 of 10 stops saved on this device');
});
