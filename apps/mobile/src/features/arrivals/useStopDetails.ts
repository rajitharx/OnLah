import { useEffect, useState } from 'react';
import { searchBusStops } from '../../shared/services/onlahApi';
import { findExactStop } from '../../shared/utils/favourites';
import type { BusStop } from '../../types/domain';

// A saved stop opens with only its code, name and road. The search endpoint returns exact codes first, so one call
// finds the coordinates that Show in Maps needs. Failure is quiet: the board works without the link.
export function useStopDetails(stopCode: string, known: BusStop | null): BusStop | null {
  const [found, setFound] = useState<BusStop | null>(null);
  const hasKnown = known !== null && known.busStopCode === stopCode;

  useEffect(() => {
    if (hasKnown) return;
    const controller = new AbortController();
    searchBusStops(stopCode, controller.signal)
      .then((results) => {
        if (!controller.signal.aborted) setFound(findExactStop(results, stopCode));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [stopCode, hasKnown]);

  if (hasKnown) return known;
  return found?.busStopCode === stopCode ? found : null;
}
