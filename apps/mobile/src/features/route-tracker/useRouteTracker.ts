import { useCallback, useEffect, useRef, useState } from 'react';
import { appVisibility } from '../../shared/services/appVisibility';
import { getRouteTracker } from '../../shared/services/onlahApi';
import { startPoller, type Poller } from '../../shared/services/poller';
import { serverClock } from '../../shared/utils/serverClock';
import {
  EMPTY_TRACKER,
  applyTrackerResult,
  isNotFound,
  type TrackerResult,
  type TrackerState,
} from './trackerState';

export const TRACKER_REFRESH_MS = 20_000;

export interface UseRouteTracker extends TrackerState {
  retry: () => void;
}

// Silent refresh with no spinner. It pauses while the app is in the background, refetches when it returns, never
// starts a request while the last one is still running, and stops once the service is not found.
export function useRouteTracker(
  stopCode: string,
  serviceNo: string,
  destinationCode?: string,
  refreshMs = TRACKER_REFRESH_MS,
): UseRouteTracker {
  const [state, setState] = useState<TrackerState>(EMPTY_TRACKER);
  const pollerRef = useRef<Poller | null>(null);

  useEffect(() => {
    setState(EMPTY_TRACKER);
    const controller = new AbortController();
    let poller: Poller | null = null;
    let notFound = false;

    const apply = (result: TrackerResult): void => {
      if (controller.signal.aborted) return;
      if (!result.ok && result.notFound) {
        notFound = true;
        poller?.stop();
      }
      setState((previous) => applyTrackerResult(previous, result, serverClock.now()));
    };

    poller = startPoller(
      () =>
        getRouteTracker(stopCode, serviceNo, destinationCode, controller.signal)
          .then((value) => apply({ ok: true, value }))
          .catch((error: unknown) => apply({ ok: false, notFound: isNotFound(error) })),
      refreshMs,
      appVisibility,
    );
    // A 404 on the very first load settles before `poller` is assigned.
    if (notFound) poller.stop();
    pollerRef.current = poller;
    return () => {
      controller.abort();
      poller?.stop();
    };
  }, [stopCode, serviceNo, destinationCode, refreshMs]);

  const retry = useCallback((): void => pollerRef.current?.poll(), []);

  return { ...state, retry };
}
