import { ApiStatus, ProbeResult, classifyProbe } from './apiStatus';
import { Visibility, startPoller } from './poller';

export const STATUS_INTERVAL_MS = 10_000;

// Probes the API now and every intervalMs while the app is in the foreground, and reports each answer as an
// ApiStatus. A probe that throws counts as down. Returns a stop function; nothing is reported after it.
export function watchApiStatus(
  probe: () => Promise<ProbeResult>,
  intervalMs: number,
  visibility: Visibility,
  onStatus: (status: ApiStatus) => void,
): () => void {
  let active = true;
  const poller = startPoller(
    () =>
      probe()
        .catch((): ProbeResult => ({ ok: false, ms: 0 }))
        .then((result) => {
          if (active) onStatus(classifyProbe(result));
        }),
    intervalMs,
    visibility,
  );
  return () => {
    active = false;
    poller.stop();
  };
}
