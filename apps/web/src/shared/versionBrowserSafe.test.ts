import { describe, expect, it } from 'vitest';

const sources = import.meta.glob(['./**/*.{ts,tsx}', '../../scripts/*.mjs'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function importSpecifiers(text: string): string[] {
  return [...text.matchAll(/\b(?:from\s*|import\s*\(?\s*)(['"])([^'"]+)\1/g)].map((match) => match[2]);
}

function nodeModuleSpecifiers(text: string): string[] {
  return importSpecifiers(text).filter((specifier) => specifier.startsWith('node:'));
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

describe('nodeModuleSpecifiers', () => {
  it.each([
    ['import fs from "fs";', ['fs']],
    ["import { readFile } from 'fs/promises';", ['fs/promises']],
    ["import path from 'path';", ['path']],
    ["const m = await import('child_process');", ['child_process']],
    ['export * from "url";', ['url']],
    ["import 'worker_threads';", ['worker_threads']],
    ['import fs from "node:fs";', ['node:fs']],
    ["import { x } from 'node:fs/promises';", ['node:fs/promises']],
    ["import a from 'crypto';\nimport b from './local';", ['crypto']],
  ])('flags node modules in %j', (text, expected) => {
    expect(nodeModuleSpecifiers(text)).toEqual(expected);
  });

  it.each([
    "import fs from './fs';",
    'import path from "../path.ts";',
    "import React from 'react';",
    "import parse from 'url-parse';",
    "import x from 'fsevents';",
  ])('leaves %j alone', (text) => {
    expect(nodeModuleSpecifiers(text)).toEqual([]);
  });
});

describe('reachableFrom', () => {
  it('follows double-quoted and side-effect imports', () => {
    const files = { './a.ts': 'import "./b";', './b.ts': "import './c';", './c.ts': 'export const x = 1;' };
    expect(Object.keys(reachableFrom('./a.ts', files)).sort()).toEqual(['./a.ts', './b.ts', './c.ts']);
  });

  it('follows a helper in a subfolder and a script reached by a parent path', () => {
    const files = {
      './version.ts': "import { h } from './helpers/h';",
      './helpers/h.ts': "import { s } from '../../../scripts/s.mjs';",
      '../../scripts/s.mjs': 'import fs from "fs";',
      './other.ts': 'export const unrelated = 1;',
    };
    const reachable = reachableFrom('./version.ts', files);
    expect(Object.keys(reachable).sort()).toEqual(['../../scripts/s.mjs', './helpers/h.ts', './version.ts']);
    expect(nodeModuleSpecifiers(reachable['../../scripts/s.mjs'])).toEqual(['fs']);
  });

  it('follows an index file and stops at a cycle', () => {
    const files = { './a.ts': "import './dir';", './dir/index.ts': "import '../a';" };
    expect(Object.keys(reachableFrom('./a.ts', files)).sort()).toEqual(['./a.ts', './dir/index.ts']);
  });
});

describe('version.ts in the browser bundle', () => {
  const reachable = reachableFrom('./version.ts', sources);

  it('follows version.ts into the script module it imports', () => {
    expect(Object.keys(reachable).some((path) => path.endsWith('.mjs'))).toBe(true);
  });

  it.each(Object.entries(reachable))('%s has no node module imports and no process access', (_path, text) => {
    expect(nodeModuleSpecifiers(text)).toEqual([]);
    expect(text).not.toMatch(/\bprocess\./);
  });
});
