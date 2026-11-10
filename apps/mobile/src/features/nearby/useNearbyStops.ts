import { useEffect, useState } from 'react';
import { getNearbyStops } from '../../shared/services/onlahApi';
import type { Origin } from '../../shared/hooks/useLocation';
import type { BusStop } from '../../types/domain';
import { NEARBY_RADIUS_M, nearbyStopsSorted } from './nearbyModel';

export interface NearbyState {
  stops: BusStop[];
  loading: boolean;
  failed: boolean;
}

// Nothing is fetched until the person shares a location. A new `attempt` fetches again for the same origin.
export function useNearbyStops(origin: Origin | null, attempt = 0): NearbyState {
  const [state, setState] = useState<NearbyState>({ stops: [], loading: false, failed: false });

  useEffect(() => {
    if (origin === null) {
      setState({ stops: [], loading: false, failed: false });
      return;
    }
    const controller = new AbortController();
    setState((previous) => ({ ...previous, loading: true, failed: false }));
    getNearbyStops(origin.latitude, origin.longitude, NEARBY_RADIUS_M, controller.signal)
      .then((stops) => {
        if (!controller.signal.aborted) setState({ stops: nearbyStopsSorted(stops), loading: false, failed: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ stops: [], loading: false, failed: true });
      });
    return () => controller.abort();
  }, [origin?.latitude, origin?.longitude, attempt]);

  return state;
}
