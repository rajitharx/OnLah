import { useCallback, useEffect, useRef, useState } from 'react';
import { appVisibility } from '../../shared/services/appVisibility';
import { getArrivals } from '../../shared/services/onlahApi';
import { startPoller, type Poller } from '../../shared/services/poller';
import {
  EMPTY_ARRIVALS,
  SLOW_LOAD_MS,
  applyArrivalsResult,
  markSlowLoad,
  type ArrivalsState,
} from './arrivalsState';

export const ARRIVALS_REFRESH_MS = 20_000;

export interface StopArrivals extends ArrivalsState {
  // Fetches now, for the Resync button. The timer keeps its own schedule.
  refresh: () => void;
}

// The state remembers its stop, so the first render for a new stop never shows the old stop's times.
interface StopState {
  stopCode: string | null;
  arrivals: ArrivalsState;
}

// Silent refresh: data swaps in place with no loading state, and a failed refresh keeps the last good times.
export function useArrivals(stopCode: string, refreshMs = ARRIVALS_REFRESH_MS): StopArrivals {
  const [state, setState] = useState<StopState>({ stopCode: null, arrivals: EMPTY_ARRIVALS });
  const pollerRef = useRef<Poller | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const update = (change: (previous: ArrivalsState) => ArrivalsState): void => {
      if (controller.signal.aborted) return;
      setState((previous) => ({
        stopCode,
        arrivals: change(previous.stopCode === stopCode ? previous.arrivals : EMPTY_ARRIVALS),
      }));
    };

    setState({ stopCode, arrivals: EMPTY_ARRIVALS });
    const poller = startPoller(
      () =>
        getArrivals(stopCode, controller.signal)
          .then((value) => update((previous) => applyArrivalsResult(previous, { ok: true, value })))
          .catch(() => update((previous) => applyArrivalsResult(previous, { ok: false }))),
      refreshMs,
      appVisibility,
    );
    pollerRef.current = poller;
    const slowId = setTimeout(() => update(markSlowLoad), SLOW_LOAD_MS);
    return () => {
      clearTimeout(slowId);
      poller.stop();
      controller.abort();
    };
  }, [stopCode, refreshMs]);

  const refresh = useCallback((): void => pollerRef.current?.poll(), []);

  return { ...(state.stopCode === stopCode ? state.arrivals : EMPTY_ARRIVALS), refresh };
}
