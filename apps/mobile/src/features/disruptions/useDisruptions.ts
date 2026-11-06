import { useCallback } from 'react';
import { useAutoRefresh } from '../../shared/hooks/useAutoRefresh';
import { getTrainAlerts } from '../../shared/services/onlahApi';
import { useDisruptionStore } from '../../shared/stores/disruptionStore';

const REFRESH_INTERVAL_MS = 2 * 60 * 1000;

// Polls train alerts. Mount it once, at app level, so alerts keep refreshing on every tab.
export function useDisruptions(): void {
  const setAlerts = useDisruptionStore((s) => s.setAlerts);
  const setError = useDisruptionStore((s) => s.setError);

  const fetch = useCallback(async () => {
    try {
      const res = await getTrainAlerts();
      setAlerts(res.data.status, res.data.alerts, res.fetchedAt);
    } catch {
      setError();
    }
  }, [setAlerts, setError]);

  useAutoRefresh(fetch, REFRESH_INTERVAL_MS);
}
