import { useCallback, useEffect, useRef, useState } from 'react';
import type { BusStop } from '../../types/domain';
import { api } from '../../shared/services/onlahApi';
import { startPoller, type Poller } from '../../shared/services/poller';
import { EMPTY_ARRIVALS, SLOW_LOAD_MS, applyArrivalsResult, markSlowLoad, type ArrivalsState } from './arrivalsState';

export interface StopArrivals extends ArrivalsState {
  // Fetches now, for the Refresh button. The timer keeps running on its own schedule.
  refresh: () => void;
}

// The state remembers which stop it belongs to, so the first render for a new stop never shows the old stop's times.
interface StopState {
  stopCode: string | null;
  arrivals: ArrivalsState;
}

// Silent refresh: the data swaps in place with no loading state. A failed refresh keeps the last good times.
export function useStopArrivals(stop: BusStop | null, refreshMs = 20_000): StopArrivals {
  const stopCode = stop?.busStopCode ?? null;
  const [state, setState] = useState<StopState>({ stopCode: null, arrivals: EMPTY_ARRIVALS });
  const pollerRef = useRef<Poller | null>(null);

  useEffect(() => {
    if (stopCode === null) return;

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
        api
          .getArrivals(stopCode, controller.signal)
          .then((value) => update((previous) => applyArrivalsResult(previous, { ok: true, value })))
          .catch(() => update((previous) => applyArrivalsResult(previous, { ok: false }))),
      refreshMs,
    );
    pollerRef.current = poller;
    const slowId = window.setTimeout(() => update(markSlowLoad), SLOW_LOAD_MS);
    return () => {
      window.clearTimeout(slowId);
      poller.stop();
      controller.abort();
    };
  }, [stopCode, refreshMs]);

  const refresh = useCallback((): void => pollerRef.current?.poll(), []);

  return { ...(state.stopCode === stopCode ? state.arrivals : EMPTY_ARRIVALS), refresh };
}
