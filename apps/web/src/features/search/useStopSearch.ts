import { useEffect, useState } from 'react';
import type { BusStop } from '../../types/domain';
import { api } from '../../shared/services/onlahApi';
import { checkSearchQuery, type SearchQueryCheck } from '../../shared/utils/search';
import { SLOW_LOAD_MS } from '../arrivals/arrivalsState';

const DEBOUNCE_MS = 250;

export interface StopSearchState {
  check: SearchQueryCheck;
  results: BusStop[];
  loading: boolean;
  failed: boolean;
  // Set when a search is still waiting after the cold-start threshold.
  slow: boolean;
}

// Debounces typing so each keystroke does not hit the backend.
export function useStopSearch(query: string): StopSearchState {
  const check = checkSearchQuery(query);
  const term = check.kind === 'ok' ? check.term : null;
  const [state, setState] = useState<Omit<StopSearchState, 'check'>>({
    results: [],
    loading: term !== null,
    failed: false,
    slow: false,
  });

  useEffect(() => {
    if (term === null) {
      setState({ results: [], loading: false, failed: false, slow: false });
      return;
    }

    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, failed: false, slow: false }));
    const slowId = window.setTimeout(() => {
      setState((prev) => (prev.loading ? { ...prev, slow: true } : prev));
    }, SLOW_LOAD_MS);
    const timer = window.setTimeout(() => {
      api
        .searchBusStops(term, controller.signal)
        .then((results) => {
          if (!controller.signal.aborted) setState({ results, loading: false, failed: false, slow: false });
        })
        .catch(() => {
          if (!controller.signal.aborted) setState({ results: [], loading: false, failed: true, slow: false });
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(slowId);
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  return { check, ...state };
}
