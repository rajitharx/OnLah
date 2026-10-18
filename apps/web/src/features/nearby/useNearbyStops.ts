import { useEffect, useState } from 'react';
import type { BusStop } from '../../types/domain';
import { api } from '../../shared/services/onlahApi';
import type { LatLng } from '../../shared/utils/geo';

export const NEARBY_RADIUS_M = 5_000;

export interface NearbyState {
  stops: BusStop[];
  loading: boolean;
  failed: boolean;
}

// Nothing is fetched until the visitor shares a location.
export function useNearbyStops(origin: LatLng | null): NearbyState {
  const [state, setState] = useState<NearbyState>({ stops: [], loading: false, failed: false });

  useEffect(() => {
    if (origin === null) {
      setState({ stops: [], loading: false, failed: false });
      return;
    }

    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, failed: false }));
    api
      .getNearbyStops(origin.latitude, origin.longitude, NEARBY_RADIUS_M, controller.signal)
      .then((stops) => {
        if (!controller.signal.aborted) setState({ stops, loading: false, failed: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ stops: [], loading: false, failed: true });
      });

    return () => controller.abort();
  }, [origin?.latitude, origin?.longitude]);

  return state;
}
