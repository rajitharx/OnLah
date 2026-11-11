import { useEffect, useState } from 'react';
import { getBusService } from '../../shared/services/onlahApi';
import type { BusServiceDetails } from '../../types/domain';

export interface BusServiceDetailsState {
  details: BusServiceDetails | null;
  loading: boolean;
  failed: boolean;
}

const IDLE: BusServiceDetailsState = { details: null, loading: false, failed: false };

// Loads the details only while the sheet is open for a service. Pass null while it is closed.
export function useBusServiceDetails(serviceNo: string | null): BusServiceDetailsState {
  const [state, setState] = useState<BusServiceDetailsState>(IDLE);

  useEffect(() => {
    if (serviceNo === null) {
      setState(IDLE);
      return;
    }
    const controller = new AbortController();
    setState({ details: null, loading: true, failed: false });
    getBusService(serviceNo, controller.signal)
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
