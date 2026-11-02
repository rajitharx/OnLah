import { useEffect, useState } from 'react';
import type { TrainAlertsResponse } from '../../types/domain';
import { api } from '../../shared/services/onlahApi';

export type TrainAlertsState =
  | { status: 'loading' }
  | { status: 'ok'; alerts: TrainAlertsResponse; refreshFailed: boolean }
  | { status: 'unavailable' };

export function nextStateOnFailure(current: TrainAlertsState): TrainAlertsState {
  return current.status === 'ok' ? { ...current, refreshFailed: true } : { status: 'unavailable' };
}

export function nextStateOnSuccess(alerts: TrainAlertsResponse): TrainAlertsState {
  return { status: 'ok', alerts, refreshFailed: false };
}

// The backend polls LTA every 2 minutes, so the client refreshes at the same rate.
// A failed refresh keeps the last result and flags it, so the banner can say the refresh failed.
export function useTrainAlerts(refreshMs = 120_000): TrainAlertsState {
  const [state, setState] = useState<TrainAlertsState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    const load = (): Promise<void> =>
      api
        .getTrainAlerts(controller.signal)
        .then((value) => {
          if (!controller.signal.aborted) setState(nextStateOnSuccess(value));
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setState(nextStateOnFailure);
          }
        });

    void load();
    const id = window.setInterval(() => void load(), refreshMs);
    return () => {
      window.clearInterval(id);
      controller.abort();
    };
  }, [refreshMs]);

  return state;
}
