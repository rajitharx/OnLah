import { useEffect, useState } from 'react';
import type { BusStop } from '../../types/domain';
import { api } from '../../shared/services/onlahApi';

export type BoardStopStatus = 'idle' | 'loading' | 'ready' | 'not-found' | 'failed';

export interface BoardStopState {
  stop: BusStop | null;
  status: BoardStopStatus;
}

interface Fetched {
  code: string;
  stop: BusStop | null;
  failed: boolean;
}

// A stop opened from a link has only its code. The search endpoint returns exact codes first, so one call finds it.
export function useBoardStop(stopCode: string | null, known: BusStop | null): BoardStopState {
  const [fetched, setFetched] = useState<Fetched | null>(null);
  const hasKnown = stopCode !== null && known?.busStopCode === stopCode;

  useEffect(() => {
    if (stopCode === null || hasKnown) return;

    const controller = new AbortController();
    api
      .searchBusStops(stopCode, controller.signal)
      .then((results) => {
        if (controller.signal.aborted) return;
        setFetched({ code: stopCode, stop: results.find((s) => s.busStopCode === stopCode) ?? null, failed: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setFetched({ code: stopCode, stop: null, failed: true });
      });
    return () => controller.abort();
  }, [stopCode, hasKnown]);

  if (stopCode === null) return { stop: null, status: 'idle' };
  if (hasKnown) return { stop: known, status: 'ready' };
  if (fetched === null || fetched.code !== stopCode) return { stop: null, status: 'loading' };
  if (fetched.failed) return { stop: null, status: 'failed' };
  if (fetched.stop === null) return { stop: null, status: 'not-found' };
  return { stop: fetched.stop, status: 'ready' };
}
