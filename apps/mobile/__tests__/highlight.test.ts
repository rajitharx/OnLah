import assert from 'node:assert/strict';
import { test } from 'node:test';
import { highlightParts } from '../src/shared/utils/highlight';

test('marks the matched text, ignoring case', () => {
  assert.deepEqual(highlightParts('Aft Victoria Lane', 'victoria'), [
    { text: 'Aft ', match: false },
    { text: 'Victoria', match: true },
    { text: ' Lane', match: false },
  ]);
});

test('returns the whole text unmarked when there is no match', () => {
  assert.deepEqual(highlightParts('Aft Victoria Lane', 'bugis'), [{ text: 'Aft Victoria Lane', match: false }]);
});

test('returns the whole text unmarked for an empty term', () => {
  assert.deepEqual(highlightParts('Bugis', ''), [{ text: 'Bugis', match: false }]);
});

test('treats the term as plain text, not a pattern', () => {
  assert.deepEqual(highlightParts('Stop (Blk 5)', '(blk'), [
    { text: 'Stop ', match: false },
    { text: '(Blk', match: true },
    { text: ' 5)', match: false },
  ]);
});
