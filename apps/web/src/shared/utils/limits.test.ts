import { describe, expect, it } from 'vitest';
import { isNearLimit } from './limits';

describe('isNearLimit', () => {
  it('stays quiet while there is plenty of room', () => {
    expect(isNearLimit(3, 20)).toBe(false);
  });

  it('speaks up when three quarters of the room is used', () => {
    expect(isNearLimit(15, 20)).toBe(true);
    expect(isNearLimit(8, 10)).toBe(true);
  });
});
