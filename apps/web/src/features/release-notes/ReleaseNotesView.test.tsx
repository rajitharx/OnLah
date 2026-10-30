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
    expect(ITEM_KINDS.fix.className).not.toMatch(/red|error|crowd/);
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

  it('activates no tab on the notes page', () => {
    const bar = renderToStaticMarkup(<TabBar view="notes" onChange={() => undefined} />);
    expect(bar).not.toContain('aria-current');
  });
});
