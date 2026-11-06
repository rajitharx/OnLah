export type TabView = 'saved' | 'search' | 'nearby';

export type Route =
  | { view: 'home' }
  | { view: TabView }
  | { view: 'board'; stopCode: string; serviceNo: string | null }
  | { view: 'track'; stopCode: string; serviceNo: string; destinationCode?: string }
  | { view: 'notes' };

// The optional /to/:destinationCode names the stop the bus is heading to, for a stop served in both directions.
const TRACK_PATH = /^\/track\/(\d{5})\/([^/]+?)(?:\/to\/(\d{5}))?\/?$/;
const STOP_PATH = /^\/stop\/(\d{5})(?:\/bus\/([^/]+))?\/?$/;
const TAB_PATHS: Record<string, TabView> = { '/saved': 'saved', '/search': 'search', '/nearby': 'nearby' };
// Reachable by URL only. Nothing in the app links here.
const NOTES_PATH = /^\/(?:notes|about)\/?$/;

// Paths are the source of truth for the view, so refresh, back and bookmarks keep the place.
export function parseRoute(pathname: string): Route {
  try {
    return matchRoute(pathname);
  } catch {
    // A hand-typed or truncated URL can hold a bad percent escape, and decodeURIComponent throws on it.
    return { view: 'home' };
  }
}

function matchRoute(pathname: string): Route {
  const tab = TAB_PATHS[pathname];
  if (tab !== undefined) return { view: tab };

  if (NOTES_PATH.test(pathname)) return { view: 'notes' };

  const stop = STOP_PATH.exec(pathname);
  if (stop !== null) {
    const serviceNo = stop[2] === undefined ? null : decodeURIComponent(stop[2]);
    return { view: 'board', stopCode: stop[1], serviceNo };
  }

  const track = TRACK_PATH.exec(pathname);
  if (track !== null) {
    const serviceNo = decodeURIComponent(track[2]);
    return track[3] === undefined
      ? { view: 'track', stopCode: track[1], serviceNo }
      : { view: 'track', stopCode: track[1], serviceNo, destinationCode: track[3] };
  }

  return { view: 'home' };
}

export function formatRoute(route: Route): string {
  if (route.view === 'board') {
    const base = `/stop/${route.stopCode}`;
    return route.serviceNo === null ? base : `${base}/bus/${encodeURIComponent(route.serviceNo)}`;
  }
  if (route.view === 'track') {
    const base = `/track/${route.stopCode}/${encodeURIComponent(route.serviceNo)}`;
    return route.destinationCode === undefined ? base : `${base}/to/${route.destinationCode}`;
  }
  if (route.view === 'home') return '/';
  return `/${route.view}`;
}

// A first-time visitor has nothing to read on Saved, so Search is the useful place to start.
export function defaultView(hasSaved: boolean): TabView {
  return hasSaved ? 'saved' : 'search';
}

export function trackRoute(stopCode: string, serviceNo: string, destinationCode: string | null): Route {
  return destinationCode === null ? { view: 'track', stopCode, serviceNo } : { view: 'track', stopCode, serviceNo, destinationCode };
}
