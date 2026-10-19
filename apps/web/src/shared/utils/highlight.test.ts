import { describe, expect, it } from 'vitest';
import { highlightParts } from './highlight';

describe('highlightParts', () => {
  it('marks the matched text, ignoring case', () => {
    expect(highlightParts('Aft Victoria Lane', 'victoria')).toEqual([
      { text: 'Aft ', match: false },
      { text: 'Victoria', match: true },
      { text: ' Lane', match: false },
    ]);
  });

  it('returns the whole text unmarked when there is no match', () => {
    expect(highlightParts('Aft Victoria Lane', 'bugis')).toEqual([{ text: 'Aft Victoria Lane', match: false }]);
  });

  it('treats the term as plain text, not a pattern', () => {
    expect(highlightParts('Stop (Blk 5)', '(blk')).toEqual([
      { text: 'Stop ', match: false },
      { text: '(Blk', match: true },
      { text: ' 5)', match: false },
    ]);
  });
});
