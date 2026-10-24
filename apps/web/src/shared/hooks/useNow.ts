import { useEffect, useState } from 'react';
import { serverClock } from '../services/serverClock';

// Re-renders once per interval so "Updated Ns ago" and ETAs count down live, on the backend's clock.
export function useNow(intervalMs = 1_000): number {
  const [now, setNow] = useState(() => serverClock.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(serverClock.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
