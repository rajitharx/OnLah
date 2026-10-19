import { describe, expect, it } from 'vitest';
import { moveItem } from './listOrder';

const sameStop = (a: string, b: string): boolean => a[0] === b[0];

describe('moveItem', () => {
  it('swaps an item with its neighbour', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b']);
  });

  it('leaves the list alone at either end', () => {
    expect(moveItem(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
  });

  it('skips items outside the group, so a bus only moves among buses at its stop', () => {
    expect(moveItem(['A1', 'B1', 'A2'], 2, -1, sameStop)).toEqual(['A2', 'B1', 'A1']);
  });

  it('does not change the input', () => {
    const list = ['a', 'b'];
    moveItem(list, 0, 1);
    expect(list).toEqual(['a', 'b']);
  });
});
