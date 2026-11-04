import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../shared/services/onlahApi';
import { startPoller, type Poller } from '../../shared/services/poller';
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

// One poller per stop, started together. Each stop keeps its own last good data and its own request in flight.
export function useSavedArrivals(stopCodes: string[], refreshMs = 20_000): SavedArrivals {
  const key = stopCodes.join(',');
  const [states, setStates] = useState<Record<string, ArrivalsState>>({});
  const pollersRef = useRef(new Map<string, Poller>());

  useEffect(() => {
    const codes = key === '' ? [] : key.split(',');
    const controller = new AbortController();
    const fetchStop = (code: string): Promise<void> => {
      const apply = (result: ArrivalsResult): void => {
        if (!controller.signal.aborted) setStates((prev) => setStopState(prev, code, result));
      };
      return api
        .getArrivals(code, controller.signal)
        .then((value) => apply({ ok: true, value }))
        .catch(() => apply({ ok: false }));
    };

    const pollers = new Map(codes.map((code) => [code, startPoller(() => fetchStop(code), refreshMs)]));
    pollersRef.current = pollers;
    const slowId = window.setTimeout(() => {
      if (controller.signal.aborted) return;
      setStates((prev) => {
        const next = { ...prev };
        for (const code of codes) next[code] = markSlowLoad(next[code] ?? { data: null, failed: false, slow: false });
        return next;
      });
    }, SLOW_LOAD_MS);

    return () => {
      window.clearTimeout(slowId);
      for (const poller of pollers.values()) poller.stop();
      controller.abort();
    };
  }, [key, refreshMs]);

  const resync = useCallback((stopCode: string): void => pollersRef.current.get(stopCode)?.poll(), []);

  return { states, resync };
}
