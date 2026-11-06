import { useCallback, useState } from 'react';
import { useAutoRefresh } from '../../shared/hooks/useAutoRefresh';
import { getArrivals } from '../../shared/services/onlahApi';
import { serverClock } from '../../shared/utils/serverClock';
import { BusArrivalsResponse } from '../../types/domain';

const REFRESH_INTERVAL_MS = 20_000;

interface ArrivalsState {
  data: BusArrivalsResponse | null;
  isLoading: boolean;
  // True while a refresh the user asked for (pull or button) is running. The 20s timer stays silent.
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useArrivals(stopCode: string): ArrivalsState {
  const [data, setData] = useState<BusArrivalsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      const result = await getArrivals(stopCode);
      serverClock.sync(result.fetchedAt);
      setData(result);
      setError(null);
    } catch {
      setError('Could not load arrivals. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [stopCode]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetch]);

  useAutoRefresh(fetch, REFRESH_INTERVAL_MS);

  return { data, isLoading, isRefreshing, error, refresh };
}
