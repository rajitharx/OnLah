import { MAX_SEARCH_RESULTS, type SearchQueryCheck } from '../../shared/utils/search';

export interface SearchStatusInput {
  check: SearchQueryCheck;
  loading: boolean;
  slow: boolean;
  failed: boolean;
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
