import { describe, expect, it } from 'vitest';
import { busTypeName, crowdBarCount } from './arrival';

describe('crowdBarCount', () => {
  it('fills one bar for seats, two for standing, and three when crowded', () => {
    expect([0, 1, 2].map((level) => crowdBarCount(level as 0 | 1 | 2))).toEqual([1, 2, 3]);
  });
});

describe('busTypeName', () => {
  it('spells out the deck type so SD and DD are not left to an icon', () => {
    expect([0, 1, 2].map((type) => busTypeName(type as 0 | 1 | 2))).toEqual(['single deck', 'double deck', 'bendy']);
  });
});
