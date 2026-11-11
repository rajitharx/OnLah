import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import type { Visibility } from '../src/shared/services/poller';
import { startStopPollers } from '../src/features/saved-buses/stopPollers';

const settle = async (): Promise<void> => {
  for (let i = 0; i < 4; i += 1) await Promise.resolve();
};

const visibility: Visibility = { isActive: () => true, subscribe: () => () => undefined };

beforeEach(() => mock.timers.enable({ apis: ['setInterval'] }));
afterEach(() => mock.timers.reset());

test('starts one poller per stop and loads each at once', () => {
  const loaded: string[] = [];
  const pollers = startStopPollers(['01012', '03111'], (code) => { loaded.push(code); return Promise.resolve(); }, 20_000, visibility);
  assert.deepEqual(loaded, ['01012', '03111']);
  assert.equal(pollers.size, 2);
  pollers.stopAll();
});

test('each stop keeps its own timer, and stopAll ends them all', async () => {
  const loaded: string[] = [];
  const pollers = startStopPollers(['01012', '03111'], (code) => { loaded.push(code); return Promise.resolve(); }, 20_000, visibility);
  await settle();
  mock.timers.tick(20_000);
  assert.equal(loaded.filter((c) => c === '01012').length, 2);
  pollers.stopAll();
  mock.timers.tick(60_000);
  assert.equal(loaded.length, 4);
});

test('resync polls just the named stop and ignores unknown stops', () => {
  const loaded: string[] = [];
  const pollers = startStopPollers(['01012', '03111'], (code) => { loaded.push(code); return Promise.resolve(); }, 20_000, visibility);
  loaded.length = 0;
  return Promise.resolve().then(() => Promise.resolve()).then(() => {
    pollers.resync('03111');
    pollers.resync('99999');
    assert.deepEqual(loaded, ['03111']);
    pollers.stopAll();
  });
});

test('duplicate stop codes share one poller', () => {
  const pollers = startStopPollers(['01012', '01012'], () => Promise.resolve(), 20_000, visibility);
  assert.equal(pollers.size, 1);
  pollers.stopAll();
});
