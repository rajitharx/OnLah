import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mapsUrl } from '../src/shared/utils/maps';

test('mapsUrl opens the stop coordinates in Google Maps', () => {
  assert.equal(
    mapsUrl(1.2966, 103.8521),
    'https://www.google.com/maps/search/?api=1&query=1.2966,103.8521',
  );
});
