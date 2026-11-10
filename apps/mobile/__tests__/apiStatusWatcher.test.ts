import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import { ApiStatus, ProbeResult } from '../src/shared/services/apiStatus';
import { STATUS_INTERVAL_MS, watchApiStatus } from '../src/shared/services/apiStatusWatcher';
import { Visibility } from '../src/shared/services/poller';

const visible: Visibility = { isActive: () => true, subscribe: () => () => undefined };

const settle = async (): Promise<void> => {
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
};

beforeEach(() => mock.timers.enable({ apis: ['setInterval'] }));
afterEach(() => mock.timers.reset());

function run(probe: () => Promise<ProbeResult>) {
  const seen: ApiStatus[] = [];
  const stop = watchApiStatus(probe, STATUS_INTERVAL_MS, visible, (status) => seen.push(status));
  return { seen, stop };
}

test('polls every 10 seconds', () => {
  assert.equal(STATUS_INTERVAL_MS, 10_000);
});

test('reports nothing until the first answer, so the header stays on checking', async () => {
  const { seen, stop } = run(() => new Promise(() => undefined));
  await settle();
  assert.deepEqual(seen, []);
  stop();
});

test('goes good, then down when the API stops answering, then good again', async () => {
  const answers = [true, false, true];
  const { seen, stop } = run(async () => ({ ok: answers.shift() ?? true, ms: 80 }));
  await settle();
  mock.timers.tick(STATUS_INTERVAL_MS);
  await settle();
  mock.timers.tick(STATUS_INTERVAL_MS);
  await settle();
  assert.deepEqual(seen, ['good', 'down', 'good']);
  stop();
});

test('reports slow for an answer over 1.5 seconds', async () => {
  const { seen, stop } = run(async () => ({ ok: true, ms: 5_000 }));
  await settle();
  assert.deepEqual(seen, ['slow']);
  stop();
});

test('treats a probe that throws as down', async () => {
  const { seen, stop } = run(() => Promise.reject(new Error('network')));
  await settle();
  assert.deepEqual(seen, ['down']);
  stop();
});

test('stops probing and reporting once stopped', async () => {
  let calls = 0;
  const { seen, stop } = run(async () => {
    calls += 1;
    return { ok: true, ms: 80 };
  });
  await settle();
  stop();
  mock.timers.tick(30_000);
  await settle();
  assert.equal(calls, 1);
  assert.deepEqual(seen, ['good']);
});

test('drops an answer that lands after it was stopped', async () => {
  let release: (result: ProbeResult) => void = () => undefined;
  const { seen, stop } = run(() => new Promise<ProbeResult>((resolve) => (release = resolve)));
  stop();
  release({ ok: true, ms: 10 });
  await settle();
  assert.deepEqual(seen, []);
});
