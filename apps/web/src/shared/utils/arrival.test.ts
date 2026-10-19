import { describe, expect, it } from 'vitest';
import { busTypeLabel } from './arrival';

describe('busTypeLabel', () => {
  it('spells out the deck type, so no icon is needed to tell buses apart', () => {
    expect([0, 1, 2].map((type) => busTypeLabel(type as 0 | 1 | 2))).toEqual(['Single', 'Double', 'Bendy']);
  });
});
