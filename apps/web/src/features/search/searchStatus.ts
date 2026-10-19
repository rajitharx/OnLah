import type { SearchQueryCheck } from '../../shared/utils/search';

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
