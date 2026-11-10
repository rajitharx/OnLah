import assert from 'node:assert/strict';
import { test } from 'node:test';
import { busTypeLabel } from '../src/shared/utils/busType';

test('busTypeLabel names each LTA bus type', () => {
  assert.equal(busTypeLabel(0), 'Single');
  assert.equal(busTypeLabel(1), 'Double');
  assert.equal(busTypeLabel(2), 'Bendy');
});
