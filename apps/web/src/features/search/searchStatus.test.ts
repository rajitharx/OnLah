import { describe, expect, it } from 'vitest';
import { resultCountMessage, searchStatusMessage } from './searchStatus';

describe('resultCountMessage', () => {
  it('counts the results below the limit', () => {
    expect(resultCountMessage(1)).toBe('1 result');
    expect(resultCountMessage(16)).toBe('16 results');
  });

  it('says the list is cut off when the backend returns its limit', () => {
    expect(resultCountMessage(20)).toBe('Showing the top 20. Add a word to narrow it down.');
  });
});

const searching = { check: { kind: 'ok', term: 'Victoria' } as const, failed: false, slow: false };

describe('searchStatusMessage', () => {
  it('says it is searching while a query is in flight', () => {
    expect(searchStatusMessage({ ...searching, loading: true })).toBe('Searching…');
  });

  it('explains a slow first call, which is usually the backend waking up', () => {
    expect(searchStatusMessage({ ...searching, loading: true, slow: true })).toBe(
      'Waking up the server… the first search can take up to a minute.',
    );
  });

  it('says nothing once the search has finished', () => {
    expect(searchStatusMessage({ ...searching, loading: false })).toBeNull();
  });

  it('says nothing when there is no valid query to search for', () => {
    expect(searchStatusMessage({ check: { kind: 'empty' }, loading: true, failed: false, slow: true })).toBeNull();
  });
});
