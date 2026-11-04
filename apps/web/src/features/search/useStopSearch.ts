import { useEffect, useState } from 'react';
import type { BusStop } from '../../types/domain';
import { api } from '../../shared/services/onlahApi';
import { checkSearchQuery, type SearchQueryCheck } from '../../shared/utils/search';
import { SLOW_LOAD_MS } from '../arrivals/arrivalsState';
import { classifySearchFailure, type SearchFailure } from './searchStatus';

const DEBOUNCE_MS = 250;

export interface StopSearchState {
  check: SearchQueryCheck;
  results: BusStop[];
  loading: boolean;
  failure: SearchFailure | null;
  // Set when a search is still waiting after the cold-start threshold.
  slow: boolean;
}

// Debounces typing so each keystroke does not hit the backend.
// A new `attempt` searches the same term again, so a failed search can be retried.
export function useStopSearch(query: string, attempt = 0): StopSearchState {
  const check = checkSearchQuery(query);
  const term = check.kind === 'ok' ? check.term : null;
  const [state, setState] = useState<Omit<StopSearchState, 'check'>>({
    results: [],
    loading: term !== null,
    failure: null,
    slow: false,
  });

  useEffect(() => {
    if (term === null) {
      setState({ results: [], loading: false, failure: null, slow: false });
      return;
    }

    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, failure: null, slow: false }));
    const slowId = window.setTimeout(() => {
      setState((prev) => (prev.loading ? { ...prev, slow: true } : prev));
    }, SLOW_LOAD_MS);
    const timer = window.setTimeout(() => {
      api
        .searchBusStops(term, controller.signal)
        .then((results) => {
          if (!controller.signal.aborted) setState({ results, loading: false, failure: null, slow: false });
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) setState({ results: [], loading: false, failure: classifySearchFailure(error), slow: false });
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(slowId);
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term, attempt]);

  return { check, ...state };
}
