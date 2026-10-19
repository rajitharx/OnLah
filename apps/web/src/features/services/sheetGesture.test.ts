import { describe, expect, it } from 'vitest';
import { isSwipeDismiss } from './sheetGesture';

describe('isSwipeDismiss', () => {
  it('dismisses on a clear downward swipe', () => {
    expect(isSwipeDismiss(100, 200)).toBe(true);
  });

  it('ignores a small wobble, so a tap on the header does not close the sheet', () => {
    expect(isSwipeDismiss(100, 120)).toBe(false);
  });

  it('ignores an upward swipe', () => {
    expect(isSwipeDismiss(200, 100)).toBe(false);
  });
});
