import { useEffect, useState } from 'react';
import { serverClock } from '../utils/serverClock';

export function useNow(intervalMs = 1_000): number {
  const [now, setNow] = useState(() => serverClock.now());

  useEffect(() => {
    const id = setInterval(() => setNow(serverClock.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
