import { useEffect, useState } from 'react';
import type { BusArrivalsResponse } from '../../types/domain';
import { makeSampleArrivals } from '../../shared/services/sampleData';

// Silent refresh: the data swaps in place, with no loading state.
// The backend poll is every 20s, matching the mobile app.
export function useStopArrivals(stopCode: string, refreshMs = 20_000): BusArrivalsResponse {
  const [data, setData] = useState<BusArrivalsResponse>(() => makeSampleArrivals(stopCode, Date.now()));

  useEffect(() => {
    setData(makeSampleArrivals(stopCode, Date.now()));
    const id = window.setInterval(() => setData(makeSampleArrivals(stopCode, Date.now())), refreshMs);
    return () => window.clearInterval(id);
  }, [stopCode, refreshMs]);

  return data;
}
