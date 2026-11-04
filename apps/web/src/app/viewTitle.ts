import type { Route } from './routes';

const TAB_TITLES = { saved: 'Saved', search: 'Search stops', nearby: 'Nearby stops', notes: 'Release notes' } as const;

export function viewTitle(route: Exclude<Route, { view: 'home' }>, stop: { busStopCode: string; description: string } | null): string {
  if (route.view === 'board') {
    return stop === null ? `Stop ${route.stopCode} · OnLah` : `Stop ${stop.busStopCode} · ${stop.description} · OnLah`;
  }
  if (route.view === 'track') return `Bus ${route.serviceNo} at stop ${route.stopCode} · OnLah`;
  return `${TAB_TITLES[route.view]} · OnLah`;
}

// A service sheet opening on a board changes the route but not the screen, so it does not count as a new view.
export function viewKey(route: Route): string {
  if (route.view === 'board') return `board/${route.stopCode}`;
  if (route.view === 'track') return `track/${route.stopCode}/${route.serviceNo}`;
  return route.view;
}

interface Focusable {
  tabIndex: number;
  focus: () => void;
}

// Without this, a screen change leaves focus on the control that was pressed, which is now gone or off screen.
export function focusHeading(root: { querySelector: (selector: string) => Focusable | null }): boolean {
  const heading = root.querySelector('main h1');
  if (heading === null) return false;
  heading.tabIndex = -1;
  heading.focus();
  return true;
}
