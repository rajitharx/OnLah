import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppHeader } from '../../app/AppHeader';
import { TabBar } from '../../app/TabBar';
import { ReleaseNotesView } from './ReleaseNotesView';
import { ITEM_KINDS, releases, ROADMAP_STATUSES } from './releases';

describe('ReleaseNotesView', () => {
  const html = renderToStaticMarkup(<ReleaseNotesView version="1.49" />);

  it('shows the current version', () => {
    expect(html).toContain('Beta 1.49');
  });

  it('shows the latest release with its title', () => {
    expect(html).toContain(releases[0].version);
    expect(html).toContain(releases[0].title);
  });

  it('labels each kind of item', () => {
    for (const { label } of Object.values(ITEM_KINDS)) expect(html).toContain(label);
  });

  it('groups the roadmap as Shipped, Next and Later', () => {
    for (const { label } of ROADMAP_STATUSES) expect(html).toContain(label);
    expect(html).toMatch(/>Shipped</);
    expect(html).toMatch(/>Next</);
    expect(html).toMatch(/>Later</);
  });

  it('has one h1 and heads its sections', () => {
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('<h2');
  });

  it('does not style fixes with the crowd red', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/app/styles.css'), 'utf8');
    const rule = new RegExp(`\\.${ITEM_KINDS.fix.className}\\s*\\{([^}]*)\\}`).exec(css)?.[1];
    expect(rule).toBeDefined();
    expect(rule).not.toMatch(/crowd|red|error/);
  });
});

describe('navigation stays unlinked from the notes page', () => {
  const nav = renderToStaticMarkup(
    <>
      <AppHeader version="Beta 1.49" onHome={() => undefined} />
      <TabBar view="saved" onChange={() => undefined} />
    </>,
  );

  it('has no link to /notes or /about', () => {
    expect(nav).not.toMatch(/\/notes|\/about/);
  });

  it('mentions /notes or /about nowhere else in the app source', () => {
    const src = resolve(process.cwd(), 'src');
    const allowed = (file: string) =>
      /\.test\.tsx?$/.test(file) || file.endsWith('.css') || file === 'app/routes.ts' || file.startsWith('features/release-notes/');
    const offenders = (readdirSync(src, { recursive: true }) as string[])
      .map((file) => file.split('\\').join('/'))
      .filter((file) => /\.(ts|tsx)$/.test(file) && !allowed(file))
      .filter((file) => /\/(notes|about)\b/.test(readFileSync(join(src, file), 'utf8')))
      .map((file) => relative(src, join(src, file)));
    expect(offenders).toEqual([]);
  });

  it('activates no tab on the notes page', () => {
    const bar = renderToStaticMarkup(<TabBar view="notes" onChange={() => undefined} />);
    expect(bar).not.toContain('aria-current');
  });
});
