import assert from 'node:assert/strict';
import { test } from 'node:test';
import { colors } from '../src/shared/theme/colors';
import { withAlpha } from '../src/shared/theme/alpha';

test('derives the tints the screens used to hardcode', () => {
  assert.equal(withAlpha(colors.accent, 0.1), 'rgba(245, 236, 215, 0.1)');
  assert.equal(withAlpha(colors.accent, 0.2), 'rgba(245, 236, 215, 0.2)');
  assert.equal(withAlpha(colors.crowdGreen, 0.12), 'rgba(76, 175, 80, 0.12)');
  assert.equal(withAlpha(colors.crowdGreen, 0.3), 'rgba(76, 175, 80, 0.3)');
});

test('rejects anything that is not a six digit hex colour', () => {
  assert.throws(() => withAlpha('red', 0.5));
  assert.throws(() => withAlpha('#fff', 0.5));
});
