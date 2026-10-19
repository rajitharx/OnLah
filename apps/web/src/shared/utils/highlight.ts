export interface HighlightPart {
  text: string;
  match: boolean;
}

// Splits text around the first case-insensitive match of the term, so the match can be bolded.
// The term is compared as plain text, so characters like "(" are never read as a pattern.
export function highlightParts(text: string, term: string): HighlightPart[] {
  const start = term === '' ? -1 : text.toLowerCase().indexOf(term.toLowerCase());
  if (start === -1) return [{ text, match: false }];

  const end = start + term.length;
  return [
    { text: text.slice(0, start), match: false },
    { text: text.slice(start, end), match: true },
    { text: text.slice(end), match: false },
  ].filter((part) => part.text !== '');
}
