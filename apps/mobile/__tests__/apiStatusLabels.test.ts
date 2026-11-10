import assert from 'node:assert/strict';
import { test } from 'node:test';
import { API_STATUS_LABEL, betaLabel } from '../src/shared/services/apiStatus';

test('each status has the web wording', () => {
  assert.deepEqual(API_STATUS_LABEL, {
    checking: 'Checking live data',
    good: 'Live data is online',
    slow: 'Live data is slow',
    down: 'Live data is offline',
  });
});

test('the header version label reads Beta with the version', () => {
  assert.equal(betaLabel('1.4'), 'Beta 1.4');
});
