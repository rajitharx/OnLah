import { describe, expect, it } from 'vitest';

const sources = import.meta.glob(['./version.ts', '../../scripts/*.mjs'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function importSpecifiers(text: string): string[] {
  return [...text.matchAll(/\bfrom\s+'([^']+)'/g)].map((match) => match[1]);
}

// Vite bundles version.ts for the browser, so nothing it imports may touch node. Tests and tsc run under node and miss this.
function reachableFrom(entry: string, files: Record<string, string>): Record<string, string> {
  const found: Record<string, string> = {};
  const queue = [entry];
  while (queue.length > 0) {
    const path = queue.pop() as string;
    if (path in found) continue;
    found[path] = files[path];
    for (const specifier of importSpecifiers(files[path])) {
      if (specifier in files) queue.push(specifier);
    }
  }
  return found;
}

describe('importSpecifiers', () => {
  it.each([
    ["import { a } from 'x';", ['x']],
    ['import { a } from "x";', ['x']],
    ["import 'x';", ['x']],
    ['import "x";', ['x']],
    ["export * from 'x';", ['x']],
    ['export { a } from "x";', ['x']],
    ["const m = await import('x');", ['x']],
    ['const m = await import("x");', ['x']],
    ["import type { T } from 'x';", ['x']],
    ["import a from 'x';\nimport 'y';\nexport * from \"z\";", ['x', 'y', 'z']],
  ])('finds the specifiers in %j', (text, expected) => {
    expect(importSpecifiers(text)).toEqual(expected);
  });

  it('ignores a dynamic import with a computed specifier', () => {
    expect(importSpecifiers('import(name)')).toEqual([]);
  });
});

describe('reachableFrom', () => {
  it('follows double-quoted and side-effect imports', () => {
    const files = { a: 'import "b";', b: "import 'c';", c: 'export const x = 1;' };
    expect(Object.keys(reachableFrom('a', files)).sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('version.ts in the browser bundle', () => {
  const reachable = reachableFrom('./version.ts', sources);

  it('follows version.ts into the script module it imports', () => {
    expect(Object.keys(reachable).some((path) => path.endsWith('.mjs'))).toBe(true);
  });

  it.each(Object.entries(reachable))('%s has no node: imports and no process access', (_path, text) => {
    expect(text).not.toMatch(/['"]node:/);
    expect(text).not.toMatch(/\bprocess\./);
  });
});
