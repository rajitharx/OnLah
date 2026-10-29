import { useEffect, useState } from 'react';
import type { TrainAlertsResponse } from '../../types/domain';
import { api } from '../../shared/services/onlahApi';

export type TrainAlertsState =
  | { status: 'loading' }
  | { status: 'ok'; alerts: TrainAlertsResponse }
  | { status: 'unavailable' };

// The backend polls LTA every 2 minutes, so the client refreshes at the same rate.
// A failed refresh keeps the last result, and the banner's "Checked" time shows how old it is.
export function useTrainAlerts(refreshMs = 120_000): TrainAlertsState {
  const [state, setState] = useState<TrainAlertsState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    const load = (): Promise<void> =>
      api
        .getTrainAlerts(controller.signal)
        .then((value) => {
          if (!controller.signal.aborted) setState({ status: 'ok', alerts: value });
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setState((current) => (current.status === 'ok' ? current : { status: 'unavailable' }));
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
