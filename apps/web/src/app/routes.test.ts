import { describe, expect, it } from 'vitest';
import { defaultView, formatRoute, parseRoute } from './routes';

describe('parseRoute', () => {
  it('maps the root to the home route', () => {
    expect(parseRoute('/')).toEqual({ view: 'home' });
  });

  it('maps each tab to its own path', () => {
    expect(parseRoute('/saved')).toEqual({ view: 'saved' });
    expect(parseRoute('/search')).toEqual({ view: 'search' });
    expect(parseRoute('/nearby')).toEqual({ view: 'nearby' });
  });

  it('reads a stop code from a stop path', () => {
    expect(parseRoute('/stop/01121')).toEqual({ view: 'board', stopCode: '01121', serviceNo: null });
  });

  it('reads the service from a bus path under a stop', () => {
    expect(parseRoute('/stop/01121/bus/197')).toEqual({ view: 'board', stopCode: '01121', serviceNo: '197' });
  });

  it('reads the stop and service from a track path', () => {
    expect(parseRoute('/track/67009/161')).toEqual({ view: 'track', stopCode: '67009', serviceNo: '161' });
  });

  it('keeps a lowercase service number in a track path as it is', () => {
    expect(parseRoute('/track/67009/10e')).toEqual({ view: 'track', stopCode: '67009', serviceNo: '10e' });
  });

  it('falls back to home for a track path with a bad stop code', () => {
    expect(parseRoute('/track/6700/161')).toEqual({ view: 'home' });
  });

  it('falls back to home for a stop code that is not five digits', () => {
    expect(parseRoute('/stop/12')).toEqual({ view: 'home' });
  });

  it('falls back to home for an unknown path', () => {
    expect(parseRoute('/somewhere/else')).toEqual({ view: 'home' });
  });
});

describe('formatRoute', () => {
  it('round-trips every stop and bus path', () => {
    for (const path of ['/search', '/stop/01121', '/stop/01121/bus/197', '/track/67009/10e']) {
      expect(formatRoute(parseRoute(path))).toBe(path);
    }
  });

  it('formats a board route with its service', () => {
    expect(formatRoute({ view: 'board', stopCode: '01121', serviceNo: '197' })).toBe('/stop/01121/bus/197');
  });
});

describe('defaultView', () => {
  it('opens Search for a visitor with nothing saved', () => {
    expect(defaultView(false)).toBe('search');
  });

  it('opens Saved once something is saved', () => {
    expect(defaultView(true)).toBe('saved');
  });
});
