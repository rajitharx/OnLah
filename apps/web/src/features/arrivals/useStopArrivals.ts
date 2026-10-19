import { useCallback, useEffect, useRef, useState } from 'react';
import type { BusStop } from '../../types/domain';
import { api } from '../../shared/services/onlahApi';
import { EMPTY_ARRIVALS, SLOW_LOAD_MS, applyArrivalsResult, markSlowLoad, type ArrivalsState } from './arrivalsState';

export interface StopArrivals extends ArrivalsState {
  // Fetches now, for the Refresh button. The timer keeps running on its own schedule.
  refresh: () => void;
}

// Silent refresh: the data swaps in place with no loading state. A failed refresh keeps the last good times.
export function useStopArrivals(stop: BusStop | null, refreshMs = 20_000): StopArrivals {
  const stopCode = stop?.busStopCode ?? null;
  const [state, setState] = useState<ArrivalsState>(EMPTY_ARRIVALS);
  const loadRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    if (stopCode === null) {
      setState(EMPTY_ARRIVALS);
      return;
    }

    const controller = new AbortController();
    const load = (): Promise<void> =>
      api
        .getArrivals(stopCode, controller.signal)
        .then((value) => {
          if (!controller.signal.aborted) setState((prev) => applyArrivalsResult(prev, { ok: true, value }));
        })
        .catch(() => {
          if (!controller.signal.aborted) setState((prev) => applyArrivalsResult(prev, { ok: false }));
        });

    loadRef.current = load;
    setState(EMPTY_ARRIVALS);
    void load();
    const slowId = window.setTimeout(() => setState((prev) => markSlowLoad(prev)), SLOW_LOAD_MS);
    const id = window.setInterval(() => void load(), refreshMs);
    return () => {
      window.clearTimeout(slowId);
      window.clearInterval(id);
      controller.abort();
    };
  }, [stopCode, refreshMs]);

  const refresh = useCallback((): void => {
    void loadRef.current();
  }, []);

  return { ...state, refresh };
}
