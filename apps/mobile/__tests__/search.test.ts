import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_QUERY_LENGTH, checkSearchQuery } from '../src/shared/utils/search';

test('reports an empty query', () => {
  assert.deepEqual(checkSearchQuery('   '), { kind: 'empty' });
});

test('rejects a single character, matching the backend minimum of 2', () => {
  assert.deepEqual(checkSearchQuery(' 8 '), { kind: 'too-short' });
});

test('rejects a numeric query longer than a 5-digit stop code', () => {
  assert.deepEqual(checkSearchQuery('1234567'), { kind: 'code-too-long' });
});

test('accepts a 5-digit stop code as text and keeps the leading zero', () => {
  assert.deepEqual(checkSearchQuery(' 01012 '), { kind: 'ok', term: '01012' });
});

test('accepts a road name', () => {
  assert.deepEqual(checkSearchQuery('Victoria'), { kind: 'ok', term: 'Victoria' });
});

test('caps the term at the backend maximum', () => {
  const result = checkSearchQuery('a'.repeat(MAX_QUERY_LENGTH + 20));
  assert.deepEqual(result, { kind: 'ok', term: 'a'.repeat(MAX_QUERY_LENGTH) });
});
