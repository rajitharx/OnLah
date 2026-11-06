import { useEffect, useLayoutEffect, useState } from 'react';
import { serverClock } from '../utils/serverClock';

// Pass the latest response's fetchedAt as syncKey: the clock is resynced on each response, so the sample has to be
// retaken then rather than up to a second later.
export function useNow(syncKey?: string, intervalMs = 1_000): number {
  const [now, setNow] = useState(() => serverClock.now());

  useLayoutEffect(() => {
    setNow(serverClock.now());
  }, [syncKey]);

  useEffect(() => {
    const id = setInterval(() => setNow(serverClock.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
