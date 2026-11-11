import { useCallback, useEffect, useRef, useState } from 'react';
import { appVisibility } from '../../shared/services/appVisibility';
import { getArrivals } from '../../shared/services/onlahApi';
import {
  SLOW_LOAD_MS,
  markSlowLoad,
  setStopState,
  EMPTY_ARRIVALS,
  type ArrivalsResult,
  type ArrivalsState,
} from '../arrivals/arrivalsState';
import { startStopPollers, type StopPollers } from './stopPollers';

export const SAVED_REFRESH_MS = 20_000;

export interface SavedArrivals {
  states: Record<string, ArrivalsState>;
  resync: (stopCode: string) => void;
}

// One poller per saved stop. A stop that is no longer saved stops polling when the list changes.
export function useSavedArrivals(stopCodes: string[], refreshMs = SAVED_REFRESH_MS): SavedArrivals {
  const key = stopCodes.join(',');
  const [states, setStates] = useState<Record<string, ArrivalsState>>({});
  const pollersRef = useRef<StopPollers | null>(null);

  useEffect(() => {
    const codes = key === '' ? [] : key.split(',');
    const controller = new AbortController();
    const load = (code: string): Promise<void> => {
      const apply = (result: ArrivalsResult): void => {
        if (!controller.signal.aborted) setStates((prev) => setStopState(prev, code, result));
      };
      return getArrivals(code, controller.signal)
        .then((value) => apply({ ok: true, value }))
        .catch(() => apply({ ok: false }));
    };

    const pollers = startStopPollers(codes, load, refreshMs, appVisibility);
    pollersRef.current = pollers;
    const slowId = setTimeout(() => {
      if (controller.signal.aborted) return;
      setStates((prev) => {
        const next = { ...prev };
        for (const code of codes) next[code] = markSlowLoad(next[code] ?? EMPTY_ARRIVALS);
        return next;
      });
    }, SLOW_LOAD_MS);

    return () => {
      clearTimeout(slowId);
      pollers.stopAll();
      controller.abort();
    };
  }, [key, refreshMs]);

  const resync = useCallback((stopCode: string): void => pollersRef.current?.resync(stopCode), []);
  return { states, resync };
}
