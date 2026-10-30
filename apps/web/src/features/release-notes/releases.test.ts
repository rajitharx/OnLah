import { describe, expect, it } from 'vitest';
import changelog from '../../../CHANGELOG.md?raw';
import { ITEM_KINDS, features, releases, roadmap, ROADMAP_STATUSES } from './releases';

function versionKey(version: string): [number, number] {
  const [major, minor] = version.split('.').map(Number);
  return [major, minor];
}

describe('releases', () => {
  it('lists releases newest first', () => {
    const keys = releases.map((release) => versionKey(release.version));
    const sorted = [...keys].sort((a, b) => b[0] - a[0] || b[1] - a[1]);
    expect(keys).toEqual(sorted);
  });

  it('gives every release a unique version', () => {
    const versions = releases.map((release) => release.version);
    expect(new Set(versions).size).toBe(versions.length);
  });

  it('tags every item with a known kind and gives it text', () => {
    for (const release of releases) {
      expect(release.items.length).toBeGreaterThan(0);
      for (const item of release.items) {
        expect(Object.keys(ITEM_KINDS)).toContain(item.kind);
        expect(item.text.trim()).not.toBe('');
      }
    }
  });

  it('agrees with the changelog on the newest version', () => {
    const top = /^## (\S+)/m.exec(changelog)?.[1];
    expect(releases[0].version).toBe(top);
  });

  it('only lists versions the changelog also lists', () => {
    const headings = [...changelog.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
    for (const release of releases) {
      expect(headings.some((heading) => heading === release.version || heading.endsWith(` to ${release.version}`))).toBe(true);
    }
  });

  it('includes the two latest fixes', () => {
    const text = JSON.stringify(releases);
    expect(text).toContain('Service alerts unavailable');
    expect(text).toContain('Stale arrivals warning');
  });
});

describe('roadmap and features', () => {
  it('uses only known statuses and covers all of them', () => {
    for (const item of roadmap) expect(ROADMAP_STATUSES.map((s) => s.status)).toContain(item.status);
    for (const { status } of ROADMAP_STATUSES) expect(roadmap.some((item) => item.status === status)).toBe(true);
  });

  it('describes what the app does today', () => {
    expect(features.length).toBeGreaterThan(3);
  });
});
