import { useCallback } from 'react';
import { useAutoRefresh } from '../../shared/hooks/useAutoRefresh';
import { getTrainAlerts } from '../../shared/services/onlahApi';
import { useDisruptionStore } from '../../shared/stores/disruptionStore';

const REFRESH_INTERVAL_MS = 2 * 60 * 1000;

export function useDisruptions(): void {
  const setAlerts = useDisruptionStore((s) => s.setAlerts);

  const fetch = useCallback(async () => {
    try {
      const res = await getTrainAlerts();
      setAlerts(res.data.status, res.data.alerts, res.fetchedAt);
    } catch {
      // silently ignore — don't surface disruption errors to user
    }
  }, [setAlerts]);

  useAutoRefresh(fetch, REFRESH_INTERVAL_MS);
}
