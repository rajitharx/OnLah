import { useEffect, useState } from 'react';
import type { BusServiceDetails } from '../../types/busService';
import { api } from '../../shared/services/onlahApi';

export interface BusServiceDetailsState {
  details: BusServiceDetails | null;
  loading: boolean;
  failed: boolean;
}

// Loads the details only while the popup is open for a service.
export function useBusServiceDetails(serviceNo: string | null): BusServiceDetailsState {
  const [state, setState] = useState<BusServiceDetailsState>({ details: null, loading: false, failed: false });

  useEffect(() => {
    if (serviceNo === null) {
      setState({ details: null, loading: false, failed: false });
      return;
    }

    const controller = new AbortController();
    setState({ details: null, loading: true, failed: false });
    api
      .getBusService(serviceNo, controller.signal)
      .then((details) => {
        if (!controller.signal.aborted) setState({ details, loading: false, failed: false });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ details: null, loading: false, failed: true });
      });

    return () => controller.abort();
  }, [serviceNo]);

  return state;
}
