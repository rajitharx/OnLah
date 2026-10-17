// Mirrors the backend validation: the search query must be 2 to 50 characters.
// Stop codes are exactly 5 digits, so a longer numeric query is rejected here before the request.
export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 50;
export const STOP_CODE_LENGTH = 5;

export type SearchQueryCheck =
  | { kind: 'empty' }
  | { kind: 'too-short' }
  | { kind: 'code-too-long' }
  | { kind: 'ok'; term: string };

export function checkSearchQuery(raw: string): SearchQueryCheck {
  const term = raw.trim();
  if (term === '') return { kind: 'empty' };
  if (term.length < MIN_QUERY_LENGTH) return { kind: 'too-short' };
  if (/^\d+$/.test(term) && term.length > STOP_CODE_LENGTH) return { kind: 'code-too-long' };
  return { kind: 'ok', term: term.slice(0, MAX_QUERY_LENGTH) };
}
