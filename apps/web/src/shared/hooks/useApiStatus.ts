import { useEffect, useState } from 'react';
import { startPoller } from '../services/poller';
import { classifyProbe, type ApiStatus, type ProbeResult } from '../services/apiStatus';

export const STATUS_INTERVAL_MS = 10_000;

// Probes the API now and every intervalMs while the tab is visible, and reports green, amber or red.
export function useApiStatus(probe: () => Promise<ProbeResult>, intervalMs = STATUS_INTERVAL_MS): ApiStatus {
  const [status, setStatus] = useState<ApiStatus>('checking');

  useEffect(() => {
    let active = true;
    const poller = startPoller(
      () =>
        probe()
          .catch((): ProbeResult => ({ ok: false, ms: 0 }))
          .then((result) => {
            if (active) setStatus(classifyProbe(result));
          }),
      intervalMs,
    );
    return () => {
      active = false;
      poller.stop();
    };
  }, [probe, intervalMs]);

  return status;
}
