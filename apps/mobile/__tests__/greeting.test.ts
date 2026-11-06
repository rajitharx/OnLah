import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getGreeting } from '../src/shared/utils/greeting';

const at = (hour: number, minute = 0): Date => new Date(2026, 0, 1, hour, minute);

test('greets by time of day', () => {
  assert.equal(getGreeting(at(5)), 'Good morning');
  assert.equal(getGreeting(at(11, 59)), 'Good morning');
  assert.equal(getGreeting(at(12)), 'Good afternoon');
  assert.equal(getGreeting(at(17, 59)), 'Good afternoon');
  assert.equal(getGreeting(at(18)), 'Good evening');
  assert.equal(getGreeting(at(0)), 'Good evening');
  assert.equal(getGreeting(at(4, 59)), 'Good evening');
});
