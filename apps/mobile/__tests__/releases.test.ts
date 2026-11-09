import assert from 'node:assert/strict';
import { test } from 'node:test';
import { releases } from '../src/features/release-notes/releases';

const parts = (version: string): number[] => version.split('.').map(Number);

test('every release has a unique dotted-number version', () => {
  const versions = releases.map((release) => release.version);
  assert.equal(new Set(versions).size, versions.length);
  for (const version of versions) {
    assert.match(version, /^\d+\.\d+$/);
  }
});

test('releases are listed newest first', () => {
  for (let i = 1; i < releases.length; i += 1) {
    const [newerMajor, newerMinor] = parts(releases[i - 1].version);
    const [olderMajor, olderMinor] = parts(releases[i].version);
    const isNewer = newerMajor > olderMajor || (newerMajor === olderMajor && newerMinor > olderMinor);
    assert.ok(isNewer, `${releases[i - 1].version} must come before ${releases[i].version}`);
  }
});

test('every release has a title, a summary and at least one item', () => {
  for (const release of releases) {
    assert.ok(release.title.length > 0);
    assert.ok(release.summary.length > 0);
    assert.ok(release.items.length > 0);
  }
});
