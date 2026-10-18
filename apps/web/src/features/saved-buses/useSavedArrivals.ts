import { useEffect, useState } from 'react';
import { api } from '../../shared/services/onlahApi';
import {
  EMPTY_ARRIVALS,
  SLOW_LOAD_MS,
  applyArrivalsResult,
  markSlowLoad,
  type ArrivalsResult,
  type ArrivalsState,
} from '../arrivals/arrivalsState';

// One request per stop, refreshed together. Each stop keeps its own last good data.
export function useSavedArrivals(stopCodes: string[], refreshMs = 20_000): Record<string, ArrivalsState> {
  const key = stopCodes.join(',');
  const [states, setStates] = useState<Record<string, ArrivalsState>>({});

  useEffect(() => {
    const codes = key === '' ? [] : key.split(',');
    const controller = new AbortController();

    const apply = (code: string, result: ArrivalsResult): void => {
      if (controller.signal.aborted) return;
      setStates((prev) => ({ ...prev, [code]: applyArrivalsResult(prev[code] ?? EMPTY_ARRIVALS, result) }));
    };
    const load = (): void => {
      for (const code of codes) {
        api
          .getArrivals(code, controller.signal)
          .then((value) => apply(code, { ok: true, value }))
          .catch(() => apply(code, { ok: false }));
      }
    };

    load();
    const slowId = window.setTimeout(() => {
      if (controller.signal.aborted) return;
      setStates((prev) => {
        const next = { ...prev };
        for (const code of codes) next[code] = markSlowLoad(next[code] ?? EMPTY_ARRIVALS);
        return next;
      });
    }, SLOW_LOAD_MS);
    const id = window.setInterval(load, refreshMs);

    return () => {
      window.clearTimeout(slowId);
      window.clearInterval(id);
      controller.abort();
    };
  }, [key, refreshMs]);

  return states;
}
