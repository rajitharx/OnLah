import { useCallback, useEffect, useState } from 'react';
import { api } from '../../shared/services/onlahApi';
import {
  SLOW_LOAD_MS,
  markSlowLoad,
  setStopState,
  type ArrivalsResult,
  type ArrivalsState,
} from '../arrivals/arrivalsState';

export interface SavedArrivals {
  states: Record<string, ArrivalsState>;
  // Fetches one stop now, for the Re-sync buttons. The timer keeps its own schedule.
  resync: (stopCode: string) => void;
}

// One request per stop, refreshed together. Each stop keeps its own last good data.
export function useSavedArrivals(stopCodes: string[], refreshMs = 20_000): SavedArrivals {
  const key = stopCodes.join(',');
  const [states, setStates] = useState<Record<string, ArrivalsState>>({});

  const fetchStop = useCallback((code: string, signal?: AbortSignal): void => {
    const apply = (result: ArrivalsResult): void => {
      if (signal?.aborted) return;
      setStates((prev) => setStopState(prev, code, result));
    };
    api
      .getArrivals(code, signal)
      .then((value) => apply({ ok: true, value }))
      .catch(() => apply({ ok: false }));
  }, []);

  useEffect(() => {
    const codes = key === '' ? [] : key.split(',');
    const controller = new AbortController();
    const load = (): void => {
      for (const code of codes) fetchStop(code, controller.signal);
    };

    load();
    const slowId = window.setTimeout(() => {
      if (controller.signal.aborted) return;
      setStates((prev) => {
        const next = { ...prev };
        for (const code of codes) next[code] = markSlowLoad(next[code] ?? { data: null, failed: false, slow: false });
        return next;
      });
    }, SLOW_LOAD_MS);
    const id = window.setInterval(load, refreshMs);

    return () => {
      window.clearTimeout(slowId);
      window.clearInterval(id);
      controller.abort();
    };
  }, [key, refreshMs, fetchStop]);

  const resync = useCallback((stopCode: string): void => fetchStop(stopCode), [fetchStop]);

  return { states, resync };
}
