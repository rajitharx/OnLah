import assert from 'node:assert/strict';
import { test } from 'node:test';
import { operatorName } from '../src/shared/utils/operators';

test('names the operators the backend sends', () => {
  assert.equal(operatorName('GAS'), 'Go-Ahead Singapore');
  assert.equal(operatorName('SBST'), 'SBS Transit');
  assert.equal(operatorName('SMRT'), 'SMRT Buses');
  assert.equal(operatorName('TIBS'), 'Tower Transit Singapore');
  assert.equal(operatorName('TTS'), 'Tower Transit Singapore');
});

test('falls back to the code for an operator it does not know', () => {
  assert.equal(operatorName('XYZ'), 'XYZ');
});
