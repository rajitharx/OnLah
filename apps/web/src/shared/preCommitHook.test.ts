import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// Runs the real .githooks/pre-commit in a throwaway repo. The rule: a commit that changes the web app
// raises its minor version by one, in the same commit. A commit that touches nothing under apps/web does not.

const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
const webScripts = ['bump-version.mjs', 'version-core.mjs'];

// Git variables set by an outer commit would point the throwaway repo at the real one.
const cleanEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));

let dir: string;

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: dir, env: cleanEnv, encoding: 'utf8' });
}

function write(file: string, text: string): void {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), text);
}

const version = (): string => JSON.parse(readFileSync(path.join(dir, 'apps/web/package.json'), 'utf8')).version;
const committedFiles = (): string[] => git('show', '--name-only', '--format=', 'HEAD').split('\n').filter(Boolean);

function commit(message: string, ...files: string[]): void {
  git('add', ...files);
  git('commit', '-q', '-m', message);
}

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'onlah-hook-'));
  git('init', '-q');
  git('config', 'user.email', 'test@example.com');
  git('config', 'user.name', 'Test');
  git('config', 'commit.gpgsign', 'false');
  git('config', 'core.hooksPath', '.githooks');
  mkdirSync(path.join(dir, '.githooks'));
  copyFileSync(path.join(repoRoot, '.githooks/pre-commit'), path.join(dir, '.githooks/pre-commit'), 0);
  execFileSync('chmod', ['+x', path.join(dir, '.githooks/pre-commit')]);
  for (const script of webScripts) {
    mkdirSync(path.join(dir, 'apps/web/scripts'), { recursive: true });
    copyFileSync(path.join(repoRoot, 'apps/web/scripts', script), path.join(dir, 'apps/web/scripts', script));
  }
  write('apps/web/package.json', `${JSON.stringify({ name: 'web', version: '1.5', type: 'module' }, null, 2)}\n`);
  git('add', '-A');
  git('-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-m', 'start');
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('the pre-commit hook', () => {
  it('raises the web version and commits the bump when a web file changes', () => {
    write('apps/web/src/App.tsx', 'export {};\n');
    commit('web change', 'apps/web/src/App.tsx');
    expect(version()).toBe('1.6');
    expect(committedFiles()).toEqual(['apps/web/package.json', 'apps/web/src/App.tsx']);
  });

  it('leaves the version alone for a mobile-only commit', () => {
    write('apps/mobile/src/a.ts', 'export {};\n');
    commit('mobile change', 'apps/mobile/src/a.ts');
    expect(version()).toBe('1.5');
    expect(committedFiles()).toEqual(['apps/mobile/src/a.ts']);
  });

  it('leaves the version alone for a docs-only commit', () => {
    write('Docs/notes.md', '# notes\n');
    commit('docs', 'Docs/notes.md');
    expect(version()).toBe('1.5');
  });

  it('raises it once when a commit changes web and other folders together', () => {
    write('apps/web/src/App.tsx', 'export {};\n');
    write('apps/mobile/src/a.ts', 'export {};\n');
    commit('both', 'apps/web/src/App.tsx', 'apps/mobile/src/a.ts');
    expect(version()).toBe('1.6');
  });

  it('does not count a folder that merely starts with the same letters', () => {
    write('apps/web-extras/readme.md', '# other\n');
    commit('lookalike', 'apps/web-extras/readme.md');
    expect(version()).toBe('1.5');
  });
});
