import { describe, expect, it } from 'vitest';
import { ApiError } from '../../shared/services/onlahApi';
import { classifySearchFailure, resultCountMessage, searchAnnouncement, searchFailureMessage, searchStatusMessage } from './searchStatus';

describe('resultCountMessage', () => {
  it('counts the results below the limit', () => {
    expect(resultCountMessage(1)).toBe('1 result');
    expect(resultCountMessage(16)).toBe('16 results');
  });

  it('says the list is cut off when the backend returns its limit', () => {
    expect(resultCountMessage(20)).toBe('Showing the top 20. Add a word to narrow it down.');
  });
});

const searching = { check: { kind: 'ok', term: 'Victoria' } as const, failure: null, slow: false };

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
    expect(searchStatusMessage({ check: { kind: 'empty' }, loading: true, failure: null, slow: true })).toBeNull();
  });
});

describe('search failures', () => {
  it('tells the user to change their text when the request got no answer at all', () => {
    const failure = classifySearchFailure(new TypeError('Failed to fetch'));
    expect(searchFailureMessage(failure)).toBe("Couldn't search that text. Try different words.");
  });

  it('keeps the retry message when the backend answered with an error', () => {
    const failure = classifySearchFailure(new ApiError(503, 'LTA DataMall is unreachable.'));
    expect(searchFailureMessage(failure)).toBe('Search is unavailable right now. Try again.');
  });
});

describe('searchAnnouncement', () => {
  const done = { check: { kind: 'ok', term: 'Victoria' } as const, failure: null, slow: false, loading: false };

  it('announces searching while a query is in flight', () => {
    expect(searchAnnouncement({ ...done, loading: true }, 0)).toBe('Searching…');
  });

  it('announces the result count when results arrive', () => {
    expect(searchAnnouncement(done, 3)).toBe('3 results');
  });

  it('announces when nothing matches', () => {
    expect(searchAnnouncement(done, 0)).toBe('No stops match "Victoria".');
  });

  it('says nothing for an unfinished query or a failure, which have their own messages', () => {
    expect(searchAnnouncement({ ...done, check: { kind: 'too-short' } }, 0)).toBe('');
    expect(searchAnnouncement({ ...done, failure: 'unavailable' }, 0)).toBe('');
  });
});
