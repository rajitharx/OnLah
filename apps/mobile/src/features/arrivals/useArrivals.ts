import { useCallback, useState } from 'react';
import { useAutoRefresh } from '../../shared/hooks/useAutoRefresh';
import { getArrivals } from '../../shared/services/onlahApi';
import { BusArrivalsResponse } from '../../types/domain';

const REFRESH_INTERVAL_MS = 20_000;

interface ArrivalsState {
  data: BusArrivalsResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useArrivals(stopCode: string): ArrivalsState {
  const [data, setData] = useState<BusArrivalsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      const result = await getArrivals(stopCode);
      setData(result);
      setError(null);
    } catch {
      setError('Could not load arrivals. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [stopCode]);

  useAutoRefresh(fetch, REFRESH_INTERVAL_MS);

  return { data, isLoading, error, refresh: fetch };
}
