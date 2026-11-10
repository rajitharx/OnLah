import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiError } from '../src/shared/services/apiClient';
import {
  classifySearchFailure,
  noMatchMessage,
  resultCountMessage,
  searchAnnouncement,
  searchFailureMessage,
  searchStatusMessage,
} from '../src/features/search/searchStatus';

const searching = { check: { kind: 'ok', term: 'Victoria' } as const, failure: null, slow: false };

test('resultCountMessage counts below the cap and says the list is cut off at it', () => {
  assert.equal(resultCountMessage(1), '1 result');
  assert.equal(resultCountMessage(16), '16 results');
  assert.equal(resultCountMessage(20), 'Showing the top 20. Add a word to narrow it down.');
});

test('searchStatusMessage reports progress, and the cold-start wait when slow', () => {
  assert.equal(searchStatusMessage({ ...searching, loading: true }), 'Searching…');
  assert.equal(
    searchStatusMessage({ ...searching, loading: true, slow: true }),
    'Waking up the server… the first search can take up to a minute.',
  );
  assert.equal(searchStatusMessage({ ...searching, loading: false }), null);
  assert.equal(searchStatusMessage({ check: { kind: 'empty' }, loading: true, failure: null, slow: true }), null);
});

test('searchAnnouncement says progress, then the count or the lack of matches', () => {
  assert.equal(searchAnnouncement({ ...searching, loading: true }, 0), 'Searching…');
  assert.equal(searchAnnouncement({ ...searching, loading: false }, 3), '3 results');
  assert.equal(searchAnnouncement({ ...searching, loading: false }, 0), noMatchMessage('Victoria'));
  assert.equal(searchAnnouncement({ ...searching, loading: false, failure: 'unavailable' }, 0), '');
  assert.equal(searchAnnouncement({ check: { kind: 'too-short' }, loading: false, failure: null, slow: false }, 0), '');
});

test('a server or network failure is unavailable and worth retrying; anything else is rejected', () => {
  assert.equal(classifySearchFailure(new ApiError(503, 'down')), 'unavailable');
  assert.equal(classifySearchFailure(new ApiError(0, 'The request timed out.')), 'unavailable');
  assert.equal(classifySearchFailure(new TypeError('Network request failed')), 'unavailable');
  assert.equal(classifySearchFailure(new Error('odd')), 'rejected');
  assert.equal(searchFailureMessage('unavailable'), 'Search is unavailable right now. Try again.');
  assert.equal(searchFailureMessage('rejected'), "Couldn't search that text. Try different words.");
});
