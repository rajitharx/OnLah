import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServerClock } from '../src/shared/utils/serverClock';

test('falls back to the device clock before the first response', () => {
  const clock = createServerClock(() => 1_000);
  assert.equal(clock.now(), 1_000);
});

test('runs on the backend clock even when the device clock is wrong', () => {
  let device = Date.parse('2026-11-05T07:50:00.000Z');
  const clock = createServerClock(() => device);
  clock.sync('2026-11-05T08:00:00.000Z');
  assert.equal(clock.now(), Date.parse('2026-11-05T08:00:00.000Z'));
  device += 12_000;
  assert.equal(clock.now(), Date.parse('2026-11-05T08:00:12.000Z'));
});

test('ignores a response older than the last accepted one', () => {
  const device = 0;
  const clock = createServerClock(() => device);
  clock.sync('2026-11-05T08:00:10.000Z');
  clock.sync('2026-11-05T08:00:00.000Z');
  assert.equal(clock.now(), Date.parse('2026-11-05T08:00:10.000Z'));
});

test('ignores an unparseable timestamp', () => {
  const clock = createServerClock(() => 5);
  clock.sync('not a date');
  assert.equal(clock.now(), 5);
});
