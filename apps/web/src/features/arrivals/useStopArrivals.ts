import { useEffect, useState } from 'react';
import type { BusStop } from '../../types/domain';
import { api } from '../../shared/services/onlahApi';
import { EMPTY_ARRIVALS, applyArrivalsResult, markSlowLoad, type ArrivalsState } from './arrivalsState';

// The free-tier backend sleeps when idle, so a first call can take well over a few seconds.
const SLOW_LOAD_MS = 3_000;

// Silent refresh: the data swaps in place with no loading state. A failed refresh keeps the last good times.
export function useStopArrivals(stop: BusStop | null, refreshMs = 20_000): ArrivalsState {
  const stopCode = stop?.busStopCode ?? null;
  const [state, setState] = useState<ArrivalsState>(EMPTY_ARRIVALS);

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

  return state;
}
