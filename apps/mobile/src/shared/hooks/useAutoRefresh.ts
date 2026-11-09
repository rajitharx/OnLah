import { useEffect, useRef } from 'react';
import { appVisibility } from '../services/appVisibility';
import { startPoller } from '../services/poller';

// Runs the callback now and every intervalMs while the app is in the foreground, never overlapping two runs.
// A change of resetKey (for example a new stop code) restarts the schedule and loads at once.
export function useAutoRefresh(callback: () => void | Promise<void>, intervalMs: number, resetKey = ''): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const poller = startPoller(
      async () => {
        try {
          await callbackRef.current();
        } catch {
          // The callback reports its own failures; a rejection must not stop the schedule.
        }
      },
      intervalMs,
      appVisibility,
    );
    return poller.stop;
  }, [intervalMs, resetKey]);
}
