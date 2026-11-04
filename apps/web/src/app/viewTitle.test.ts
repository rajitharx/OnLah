import { describe, expect, it } from 'vitest';
import { focusHeading, viewKey, viewTitle } from './viewTitle';

const stop = { busStopCode: '01012', description: 'Hotel Grand Pacific' };

describe('viewTitle', () => {
  it('names each tab', () => {
    expect(viewTitle({ view: 'saved' }, null)).toBe('Saved · OnLah');
    expect(viewTitle({ view: 'search' }, null)).toBe('Search stops · OnLah');
    expect(viewTitle({ view: 'nearby' }, null)).toBe('Nearby stops · OnLah');
    expect(viewTitle({ view: 'notes' }, null)).toBe('Release notes · OnLah');
  });

  it('names the stop on a board once it is known', () => {
    const route = { view: 'board', stopCode: '01012', serviceNo: null } as const;
    expect(viewTitle(route, stop)).toBe('Stop 01012 · Hotel Grand Pacific · OnLah');
    expect(viewTitle(route, null)).toBe('Stop 01012 · OnLah');
  });

  it('names the service and stop on the tracker', () => {
    expect(viewTitle({ view: 'track', stopCode: '01012', serviceNo: '12' }, null)).toBe('Bus 12 at stop 01012 · OnLah');
  });
});

describe('viewKey', () => {
  it('stays the same while a service sheet opens and closes on a board', () => {
    const closed = { view: 'board', stopCode: '01012', serviceNo: null } as const;
    const open = { view: 'board', stopCode: '01012', serviceNo: '12' } as const;
    expect(viewKey(open)).toBe(viewKey(closed));
  });

  it('changes for another stop, another service tracked, or another view', () => {
    const board = viewKey({ view: 'board', stopCode: '01012', serviceNo: null });
    expect(viewKey({ view: 'board', stopCode: '01013', serviceNo: null })).not.toBe(board);
    expect(viewKey({ view: 'saved' })).not.toBe(board);
    expect(viewKey({ view: 'track', stopCode: '01012', serviceNo: '12' })).not.toBe(
      viewKey({ view: 'track', stopCode: '01012', serviceNo: '14' }),
    );
  });
});

describe('focusHeading', () => {
  function fakeRoot(heading: { tabIndex: number; focus: () => void } | null) {
    return { querySelector: (selector: string) => (selector === 'main h1' ? heading : null) };
  }

  it('makes the heading focusable and focuses it', () => {
    let focused = false;
    const heading = { tabIndex: 0, focus: () => { focused = true; } };

    expect(focusHeading(fakeRoot(heading))).toBe(true);
    expect(heading.tabIndex).toBe(-1);
    expect(focused).toBe(true);
  });

  it('reports false while the view has no heading yet', () => {
    expect(focusHeading(fakeRoot(null))).toBe(false);
  });
});
