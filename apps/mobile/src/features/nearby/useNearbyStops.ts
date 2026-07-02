import { useEffect, useState } from 'react';
import { useLocation } from '../../shared/hooks/useLocation';
import { getNearbyStops } from '../../shared/services/onlahApi';
import { BusStop } from '../../types/domain';

interface NearbyStopsState {
  stops: BusStop[];
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean | null;
  requestPermission: () => Promise<void>;
}

export function useNearbyStops(): NearbyStopsState {
  const { location, hasPermission, requestPermission } = useLocation();
  const [stops, setStops] = useState<BusStop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lat = location?.coords.latitude;
  const lng = location?.coords.longitude;

  useEffect(() => {
    if (lat == null || lng == null) return;
    setIsLoading(true);
    setError(null);
    getNearbyStops(lat, lng, 500)
      .then(setStops)
      .catch(() => setError('Could not load nearby stops. Check your connection.'))
      .finally(() => setIsLoading(false));
  }, [lat, lng]);

  return { stops, isLoading, error, hasPermission, requestPermission };
}
