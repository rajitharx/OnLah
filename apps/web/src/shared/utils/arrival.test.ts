import { describe, expect, it } from 'vitest';
import { busTypeName } from './arrival';

describe('busTypeName', () => {
  it('spells out the deck type so SD and DD are not left to an icon', () => {
    expect([0, 1, 2].map((type) => busTypeName(type as 0 | 1 | 2))).toEqual(['single deck', 'double deck', 'bendy']);
  });
});
