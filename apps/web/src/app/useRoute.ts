import { useCallback, useEffect, useState } from 'react';
import { formatRoute, parseRoute, type Route } from './routes';

export interface RouteControls {
  route: Route;
  // Adds a history entry, so the back button returns to the previous screen.
  push: (next: Route) => void;
  // Swaps the current entry, for example when a sheet closes.
  replace: (next: Route) => void;
}

// Entries this app wrote carry `inApp`, so the board can tell a back button it can use from a fresh page load.
export function useRoute(): RouteControls {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname));

  useEffect(() => {
    const onPop = (): void => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const push = useCallback((next: Route): void => {
    window.history.pushState({ inApp: true }, '', formatRoute(next));
    setRoute(next);
  }, []);

  const replace = useCallback((next: Route): void => {
    window.history.replaceState({ inApp: true }, '', formatRoute(next));
    setRoute(next);
  }, []);

  return { route, push, replace };
}

export function cameFromInApp(): boolean {
  return window.history.state?.inApp === true;
}
