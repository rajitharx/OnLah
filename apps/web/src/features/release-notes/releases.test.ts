import { describe, expect, it } from 'vitest';
import changelog from '../../../CHANGELOG.md?raw';
import reviewDoc from '../../../../../Docs/onlah-ui-review.md?raw';
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

const SECTIONS: Record<string, string> = { 'UI Review': 'ui', 'QA Pass': 'qa' };

// Open items that belong on no roadmap entry, with the reason. Keyed like "ui-12".
const NOT_ON_ROADMAP: Record<string, string> = {};

function openReviewItems(doc: string): string[] {
  const open: string[] = [];
  let section: string | undefined;
  for (const line of doc.split('\n')) {
    const heading = /^# (.+)$/.exec(line);
    if (heading) section = Object.entries(SECTIONS).find(([name]) => heading[1].includes(name))?.[1];
    const item = /^- \[ \] (\d+)\./.exec(line);
    if (item && section) open.push(`${section}-${item[1]}`);
  }
  return open;
}

describe('roadmap against the review document', () => {
  const planned = new Set(roadmap.filter((item) => item.status !== 'shipped').flatMap((item) => item.review ?? []));

  it('finds open items in both review sections', () => {
    const open = openReviewItems(reviewDoc);
    expect(open.some((key) => key.startsWith('ui-'))).toBe(true);
    expect(open.some((key) => key.startsWith('qa-'))).toBe(true);
  });

  it('puts every open review item in Next or Later, or explains why not', () => {
    const missing = openReviewItems(reviewDoc).filter((key) => !planned.has(key) && !(key in NOT_ON_ROADMAP));
    expect(missing).toEqual([]);
  });

  it('does not plan work the review document marks done', () => {
    const open = new Set(openReviewItems(reviewDoc));
    const stale = [...planned].filter((key) => !open.has(key));
    expect(stale).toEqual([]);
  });

  it('lists the split-flap bar decision as Later', () => {
    const entry = roadmap.find((item) => item.review?.includes('ui-11'));
    expect(entry?.status).toBe('later');
  });
});

describe('user-facing copy', () => {
  it('does not claim the whole app works offline', () => {
    expect(features.join(' ')).not.toMatch(/works offline/i);
    expect(features.join(' ')).toContain('arrival times need a connection');
  });

  it('avoids the crowd-red jargon', () => {
    expect(JSON.stringify(releases)).not.toMatch(/crowd-red/);
  });
});
