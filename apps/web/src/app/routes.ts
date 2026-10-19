export type TabView = 'saved' | 'search' | 'nearby';

export type Route =
  | { view: 'home' }
  | { view: TabView }
  | { view: 'board'; stopCode: string; serviceNo: string | null };

const STOP_PATH = /^\/stop\/(\d{5})(?:\/bus\/([^/]+))?\/?$/;
const TAB_PATHS: Record<string, TabView> = { '/saved': 'saved', '/search': 'search', '/nearby': 'nearby' };

// Paths are the source of truth for the view, so refresh, back and bookmarks keep the place.
export function parseRoute(pathname: string): Route {
  const tab = TAB_PATHS[pathname];
  if (tab !== undefined) return { view: tab };

  const stop = STOP_PATH.exec(pathname);
  if (stop !== null) {
    const serviceNo = stop[2] === undefined ? null : decodeURIComponent(stop[2]);
    return { view: 'board', stopCode: stop[1], serviceNo };
  }

  return { view: 'home' };
}

export function formatRoute(route: Route): string {
  if (route.view === 'board') {
    const base = `/stop/${route.stopCode}`;
    return route.serviceNo === null ? base : `${base}/bus/${encodeURIComponent(route.serviceNo)}`;
  }
  if (route.view === 'home') return '/';
  return `/${route.view}`;
}

// A first-time visitor has nothing to read on Saved, so Search is the useful place to start.
export function defaultView(hasSaved: boolean): TabView {
  return hasSaved ? 'saved' : 'search';
}
