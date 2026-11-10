import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LOCATE_TIMEOUT_MS, locateOnce, type LocationApi } from '../src/shared/services/locate';
import { locationFailureMessage } from '../src/features/nearby/locationMessages';

function api(overrides: Partial<LocationApi>): LocationApi {
  return {
    requestPermission: async () => 'granted',
    getPosition: async () => ({ latitude: 1.3, longitude: 103.8 }),
    ...overrides,
  };
}

test('a granted permission returns the position', async () => {
  assert.deepEqual(await locateOnce(api({})), { kind: 'ok', latitude: 1.3, longitude: 103.8 });
});

test('a refused permission is reported as denied and never asks for a position', async () => {
  let asked = false;
  const result = await locateOnce(
    api({
      requestPermission: async () => 'denied',
      getPosition: async () => {
        asked = true;
        return { latitude: 0, longitude: 0 };
      },
    }),
  );
  assert.deepEqual(result, { kind: 'failed', failure: 'denied' });
  assert.equal(asked, false);
});

test('a position that never arrives times out', async () => {
  const result = await locateOnce(api({ getPosition: () => new Promise(() => undefined) }), 10);
  assert.deepEqual(result, { kind: 'failed', failure: 'timeout' });
  assert.equal(LOCATE_TIMEOUT_MS, 10_000);
});

test('any other error is unavailable, and a timeout code is a timeout', async () => {
  const unavailable = await locateOnce(api({ getPosition: async () => { throw new Error('no gps'); } }));
  assert.deepEqual(unavailable, { kind: 'failed', failure: 'unavailable' });
  const coded = await locateOnce(
    api({ getPosition: async () => { throw Object.assign(new Error('x'), { code: 'E_LOCATION_TIMEOUT' }); } }),
  );
  assert.deepEqual(coded, { kind: 'failed', failure: 'timeout' });
  const refused = await locateOnce(api({ requestPermission: async () => { throw new Error('boom'); } }));
  assert.deepEqual(refused, { kind: 'failed', failure: 'unavailable' });
});

test('each failure has its own message, all pointing at Search', () => {
  assert.match(locationFailureMessage('denied'), /Settings/);
  assert.match(locationFailureMessage('unavailable'), /unavailable/);
  assert.match(locationFailureMessage('timeout'), /too long/);
  for (const f of ['denied', 'unavailable', 'timeout'] as const) assert.match(locationFailureMessage(f), /search/i);
});
