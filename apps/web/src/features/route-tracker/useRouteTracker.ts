import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, api } from '../../shared/services/onlahApi';
import { serverClock } from '../../shared/services/serverClock';
import { startPoller, type Poller } from '../../shared/services/poller';
import { EMPTY_TRACKER, applyTrackerResult, type TrackerResult, type TrackerState } from './trackerState';

export interface UseRouteTracker extends TrackerState {
  retry: () => void;
}

// Silent refresh with no spinner. It pauses while the tab is hidden, refetches when the tab returns,
// never starts a request while the last one is still running, and stops once the service is not found.
export function useRouteTracker(stopCode: string, serviceNo: string, destinationCode?: string, refreshMs = 20_000): UseRouteTracker {
  const [state, setState] = useState<TrackerState>(EMPTY_TRACKER);
  const pollerRef = useRef<Poller | null>(null);

  useEffect(() => {
    setState(EMPTY_TRACKER);
    const controller = new AbortController();

    const apply = (result: TrackerResult): void => {
      if (controller.signal.aborted) return;
      if (!result.ok && result.notFound) poller.stop();
      setState((previous) => applyTrackerResult(previous, result, serverClock.now()));
    };

    const poller = startPoller(
      () =>
        api
          .getRouteTracker(stopCode, serviceNo, controller.signal, destinationCode)
          .then((value) => apply({ ok: true, value }))
          .catch((error: unknown) => apply({ ok: false, notFound: error instanceof ApiError && error.status === 404 })),
      refreshMs,
    );
    pollerRef.current = poller;
    return () => {
      controller.abort();
      poller.stop();
    };
  }, [stopCode, serviceNo, destinationCode, refreshMs]);

  const retry = useCallback((): void => pollerRef.current?.poll(), []);

  return { ...state, retry };
}
