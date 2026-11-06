import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  findStopByCode,
  migrateFavourites,
  upsertFavourite,
} from '../src/shared/utils/favourites';

test('migrates string-only favourites to entries with an unknown name', () => {
  assert.deepEqual(migrateFavourites({ stopCodes: ['01012', '83139'] }, 0), {
    favourites: [
      { code: '01012', name: null, road: null },
      { code: '83139', name: null, road: null },
    ],
  });
});

test('drops malformed stored data instead of crashing', () => {
  assert.deepEqual(migrateFavourites(null, 0), { favourites: [] });
  assert.deepEqual(migrateFavourites({ stopCodes: [1012, '01012'] }, 0), {
    favourites: [{ code: '01012', name: null, road: null }],
  });
});

test('keeps current-version favourites as stored', () => {
  const favourites = [{ code: '01012', name: 'Hotel Grand Pacific', road: 'Victoria St' }];
  assert.deepEqual(migrateFavourites({ favourites }, 1), { favourites });
});

test('adds a new stop at the end, up to the limit', () => {
  const one = { code: '01012', name: 'Hotel Grand Pacific', road: 'Victoria St' };
  const two = { code: '83139', name: 'Blk 101', road: 'Bedok Nth Ave 4' };
  assert.deepEqual(upsertFavourite([one], two, 10), [one, two]);
  assert.deepEqual(upsertFavourite([one], two, 1), [one]);
});

test('fills in details for a stop already saved, keeping its position', () => {
  const unnamed = { code: '01012', name: null, road: null };
  const other = { code: '83139', name: 'Blk 101', road: 'Bedok Nth Ave 4' };
  const named = { code: '01012', name: 'Hotel Grand Pacific', road: 'Victoria St' };
  assert.deepEqual(upsertFavourite([unnamed, other], named, 2), [named, other]);
});

test('finds the exact stop code among search results', () => {
  const stop = (busStopCode: string, description: string) => ({
    busStopCode,
    description,
    roadName: 'Victoria St',
    latitude: 0,
    longitude: 0,
    distanceMeters: 0,
  });
  const results = [stop('010121', 'Elsewhere'), stop('01012', 'Hotel Grand Pacific')];
  assert.deepEqual(findStopByCode(results, '01012'), {
    code: '01012',
    name: 'Hotel Grand Pacific',
    road: 'Victoria St',
  });
  assert.equal(findStopByCode(results, '99999'), null);
});
