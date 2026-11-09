import assert from 'node:assert/strict';
import { afterEach, beforeEach, test, mock } from 'node:test';
import { startPoller, type Visibility } from '../src/shared/services/poller';

function fakeVisibility(initial = true): Visibility & { set(active: boolean): void; listeners: number } {
  let active = initial;
  const callbacks = new Set<(active: boolean) => void>();
  return {
    isActive: () => active,
    subscribe(callback) {
      callbacks.add(callback);
      return () => callbacks.delete(callback);
    },
    set(next) {
      active = next;
      callbacks.forEach((callback) => callback(next));
    },
    get listeners() {
      return callbacks.size;
    },
  };
}

const settle = async (): Promise<void> => {
  for (let i = 0; i < 4; i += 1) await Promise.resolve();
};

beforeEach(() => mock.timers.enable({ apis: ['setInterval'] }));
afterEach(() => mock.timers.reset());

test('loads at once and then on every interval', async () => {
  let loads = 0;
  const poller = startPoller(async () => { loads += 1; }, 1_000, fakeVisibility());
  assert.equal(loads, 1);
  await settle();
  mock.timers.tick(1_000);
  assert.equal(loads, 2);
  poller.stop();
});

test('never starts a load while the last one is still running', async () => {
  let loads = 0;
  let release: () => void = () => undefined;
  const poller = startPoller(() => { loads += 1; return new Promise<void>((resolve) => { release = resolve; }); }, 1_000, fakeVisibility());
  mock.timers.tick(3_000);
  assert.equal(loads, 1);
  release();
  await Promise.resolve();
  await Promise.resolve();
  poller.poll();
  assert.equal(loads, 2);
  poller.stop();
});

test('an inactive app pauses the timer and coming back loads at once and restarts it', async () => {
  let loads = 0;
  const visibility = fakeVisibility();
  const poller = startPoller(async () => { loads += 1; }, 1_000, visibility);
  await settle();
  visibility.set(false);
  mock.timers.tick(5_000);
  assert.equal(loads, 1);
  visibility.set(true);
  assert.equal(loads, 2);
  await settle();
  mock.timers.tick(1_000);
  assert.equal(loads, 3);
  poller.stop();
});

test('starting while inactive loads once and waits for the app to come back', () => {
  let loads = 0;
  const visibility = fakeVisibility(false);
  const poller = startPoller(async () => { loads += 1; }, 1_000, visibility);
  mock.timers.tick(5_000);
  assert.equal(loads, 1);
  poller.stop();
});

test('stop ends the schedule and the subscription, and poll still works by hand', async () => {
  let loads = 0;
  const visibility = fakeVisibility();
  const poller = startPoller(async () => { loads += 1; }, 1_000, visibility);
  await Promise.resolve();
  poller.stop();
  assert.equal(visibility.listeners, 0);
  mock.timers.tick(5_000);
  assert.equal(loads, 1);
  poller.poll();
  assert.equal(loads, 2);
});
