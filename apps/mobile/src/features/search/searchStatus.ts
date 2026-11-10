import { ApiError } from '../../shared/services/apiClient';
import { MAX_SEARCH_RESULTS, type SearchQueryCheck } from '../../shared/utils/search';

// 'unavailable': the backend answered with an error, or the network failed, so trying again can work.
// 'rejected': any other failure, where the same text is unlikely to work.
export type SearchFailure = 'unavailable' | 'rejected';

// React Native's fetch rejects with a TypeError when the network is down.
export function classifySearchFailure(error: unknown): SearchFailure {
  return error instanceof ApiError || error instanceof TypeError ? 'unavailable' : 'rejected';
}

export function searchFailureMessage(failure: SearchFailure): string {
  return failure === 'rejected' ? "Couldn't search that text. Try different words." : 'Search is unavailable right now. Try again.';
}

export interface SearchStatusInput {
  check: SearchQueryCheck;
  loading: boolean;
  slow: boolean;
  failure: SearchFailure | null;
}

// Shown while a search is in flight, so the screen never sits blank between keystroke and results.
export function searchStatusMessage({ check, loading, slow }: SearchStatusInput): string | null {
  if (check.kind !== 'ok' || !loading) return null;
  return slow ? 'Waking up the server… the first search can take up to a minute.' : 'Searching…';
}

export function noMatchMessage(term: string): string {
  return `No stops match "${term}".`;
}

// The backend stops at its limit without saying how many more matched, so a full page means there may be more.
export function resultCountMessage(count: number): string {
  if (count >= MAX_SEARCH_RESULTS) return `Showing the top ${MAX_SEARCH_RESULTS}. Add a word to narrow it down.`;
  return `${count} result${count === 1 ? '' : 's'}`;
}

// What the status line says: progress while searching, then the count or the lack of matches.
export function searchAnnouncement(input: SearchStatusInput, resultCount: number): string {
  const progress = searchStatusMessage(input);
  if (progress !== null) return progress;
  if (input.check.kind !== 'ok' || input.failure !== null) return '';
  return resultCount === 0 ? noMatchMessage(input.check.term) : resultCountMessage(resultCount);
}
