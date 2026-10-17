import { useEffect, useRef } from 'react';

export function useAutoRefresh(callback: () => void, intervalMs: number): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    callbackRef.current();
    const id = setInterval(() => callbackRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
