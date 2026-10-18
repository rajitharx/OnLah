import { describe, expect, it } from 'vitest';
import { checkSearchQuery } from './search';

describe('checkSearchQuery', () => {
  it('reports an empty query', () => {
    expect(checkSearchQuery('   ')).toEqual({ kind: 'empty' });
  });

  it('rejects a single character, matching the backend minimum of 2', () => {
    expect(checkSearchQuery(' 8 ')).toEqual({ kind: 'too-short' });
  });

  it('rejects a numeric query longer than a 5-digit stop code', () => {
    expect(checkSearchQuery('1234567')).toEqual({ kind: 'code-too-long' });
  });

  it('accepts a 5-digit stop code and returns the trimmed term', () => {
    expect(checkSearchQuery(' 01012 ')).toEqual({ kind: 'ok', term: '01012' });
  });

  it('accepts a road name', () => {
    expect(checkSearchQuery('Victoria')).toEqual({ kind: 'ok', term: 'Victoria' });
  });
});
