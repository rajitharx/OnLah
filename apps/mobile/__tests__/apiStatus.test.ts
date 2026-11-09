import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyProbe, SLOW_MS } from '../src/shared/services/apiStatus';

test('a failed probe is down', () => {
  assert.equal(classifyProbe({ ok: false, ms: 10 }), 'down');
});

test('a quick answer is good, including exactly at the slow limit', () => {
  assert.equal(classifyProbe({ ok: true, ms: 200 }), 'good');
  assert.equal(classifyProbe({ ok: true, ms: SLOW_MS }), 'good');
});

test('an answer slower than the limit is slow', () => {
  assert.equal(classifyProbe({ ok: true, ms: SLOW_MS + 1 }), 'slow');
});
