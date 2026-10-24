import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, api } from '../../shared/services/onlahApi';
import { serverClock } from '../../shared/services/serverClock';
import { EMPTY_TRACKER, applyTrackerResult, type TrackerResult, type TrackerState } from './trackerState';

export interface UseRouteTracker extends TrackerState {
  retry: () => void;
}

// Silent refresh with no spinner. It pauses while the tab is hidden, refetches when the tab returns,
// and never starts a request while the last one is still running.
export function useRouteTracker(stopCode: string, serviceNo: string, refreshMs = 20_000): UseRouteTracker {
  const [state, setState] = useState<TrackerState>(EMPTY_TRACKER);
  const loadRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    setState(EMPTY_TRACKER);
    const controller = new AbortController();
    let inFlight = false;
    let timer: number | undefined;

    const apply = (result: TrackerResult): void => {
      if (!controller.signal.aborted) setState((previous) => applyTrackerResult(previous, result, serverClock.now()));
    };

    const load = (): void => {
      if (inFlight) return;
      inFlight = true;
      api
        .getRouteTracker(stopCode, serviceNo, controller.signal)
        .then((value) => apply({ ok: true, value }))
        .catch((error: unknown) => apply({ ok: false, notFound: error instanceof ApiError && error.status === 404 }))
        .finally(() => {
          inFlight = false;
        });
    };

    const stopTimer = (): void => {
      if (timer !== undefined) window.clearInterval(timer);
      timer = undefined;
    };
    const startTimer = (): void => {
      stopTimer();
      timer = window.setInterval(load, refreshMs);
    };
    const onVisibility = (): void => {
      if (document.hidden) {
        stopTimer();
      } else {
        load();
        startTimer();
      }
    };

    loadRef.current = load;
    load();
    if (!document.hidden) startTimer();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      controller.abort();
      stopTimer();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [stopCode, serviceNo, refreshMs]);

  const retry = useCallback((): void => loadRef.current(), []);

  return { ...state, retry };
}
