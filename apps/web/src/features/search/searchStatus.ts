import { ApiError } from '../../shared/services/onlahApi';
import { MAX_SEARCH_RESULTS, type SearchQueryCheck } from '../../shared/utils/search';

// 'unavailable': the backend answered with an error, so trying again can work.
// 'rejected': the request never got an answer, which for search usually means a WAF dropped that exact text.
export type SearchFailure = 'unavailable' | 'rejected';

export function classifySearchFailure(error: unknown): SearchFailure {
  return error instanceof ApiError ? 'unavailable' : 'rejected';
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

// The backend stops at its limit without saying how many more matched, so a full page means there may be more.
export function resultCountMessage(count: number): string {
  if (count >= MAX_SEARCH_RESULTS) return `Showing the top ${MAX_SEARCH_RESULTS}. Add a word to narrow it down.`;
  return `${count} result${count === 1 ? '' : 's'}`;
}
