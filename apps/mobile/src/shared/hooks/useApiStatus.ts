import { useEffect, useState } from 'react';
import { ApiStatus, ProbeResult } from '../services/apiStatus';
import { STATUS_INTERVAL_MS, watchApiStatus } from '../services/apiStatusWatcher';
import { appVisibility } from '../services/appVisibility';
import { getHealth } from '../services/onlahApi';

const probeHealth = (): Promise<ProbeResult> => getHealth();

// Shows 'checking' until the first answer, then good, slow or down. Polls /health every 10 s while the app is in the foreground.
export function useApiStatus(): ApiStatus {
  const [status, setStatus] = useState<ApiStatus>('checking');

  useEffect(() => watchApiStatus(probeHealth, STATUS_INTERVAL_MS, appVisibility, setStatus), []);

  return status;
}
