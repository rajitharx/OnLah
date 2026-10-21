import { describe, expect, it } from 'vitest';
import preCommit from '../../../../.githooks/pre-commit?raw';

describe('pre-commit version hook', () => {
  it('raises the minor version and stages package.json with the commit', () => {
    expect(preCommit).toContain('apps/web/scripts/bump-version.mjs minor');
    expect(preCommit).toContain('git add apps/web/package.json');
  });
});
