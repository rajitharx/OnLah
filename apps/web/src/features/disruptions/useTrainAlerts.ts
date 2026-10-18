import { useEffect, useState } from 'react';
import type { TrainAlertsResponse } from '../../types/domain';
import { api } from '../../shared/services/onlahApi';

// The backend polls LTA every 2 minutes, so the client refreshes at the same rate.
// A failed refresh keeps the last result, and the banner's "Checked" time shows how old it is.
export function useTrainAlerts(refreshMs = 120_000): TrainAlertsResponse | null {
  const [alerts, setAlerts] = useState<TrainAlertsResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = (): Promise<void> =>
      api
        .getTrainAlerts(controller.signal)
        .then((value) => {
          if (!controller.signal.aborted) setAlerts(value);
        })
        .catch(() => undefined);

    void load();
    const id = window.setInterval(() => void load(), refreshMs);
    return () => {
      window.clearInterval(id);
      controller.abort();
    };
  }, [refreshMs]);

  return alerts;
}
