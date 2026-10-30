import { describe, expect, it } from 'vitest';

const sources = import.meta.glob(['./version.ts', '../../scripts/*.mjs'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Vite bundles version.ts for the browser, so nothing it imports may touch node. Tests and tsc run under node and miss this.
function reachableFrom(entry: string): Record<string, string> {
  const found: Record<string, string> = {};
  const queue = [entry];
  while (queue.length > 0) {
    const path = queue.pop() as string;
    if (path in found) continue;
    found[path] = sources[path];
    for (const match of sources[path].matchAll(/from\s+'([^']+)'/g)) {
      if (match[1] in sources) queue.push(match[1]);
    }
  }
  return found;
}

describe('version.ts in the browser bundle', () => {
  const reachable = reachableFrom('./version.ts');

  it('follows version.ts into the script module it imports', () => {
    expect(Object.keys(reachable).some((path) => path.endsWith('.mjs'))).toBe(true);
  });

  it.each(Object.entries(reachable))('%s has no node: imports and no process access', (_path, text) => {
    expect(text).not.toMatch(/['"]node:/);
    expect(text).not.toMatch(/\bprocess\./);
  });
});
