import { useEffect, useState } from 'react';
import { searchBusStops } from '../../shared/services/onlahApi';
import { MAX_SEARCH_RESULTS, checkSearchQuery, type SearchQueryCheck } from '../../shared/utils/search';
import type { BusStop } from '../../types/domain';
import { SLOW_LOAD_MS } from '../arrivals/arrivalsState';
import { classifySearchFailure, type SearchFailure } from './searchStatus';

export const SEARCH_DEBOUNCE_MS = 250;

export interface StopSearchState {
  check: SearchQueryCheck;
  results: BusStop[];
  loading: boolean;
  failure: SearchFailure | null;
  // Set when a search is still waiting after the cold-start threshold.
  slow: boolean;
}

// Debounces typing so each keystroke does not hit the backend, and aborts the request a newer query replaces.
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
    setState((previous) => ({ ...previous, loading: true, failure: null, slow: false }));
    const slowId = setTimeout(() => {
      setState((previous) => (previous.loading ? { ...previous, slow: true } : previous));
    }, SLOW_LOAD_MS);
    const timer = setTimeout(() => {
      searchBusStops(term, controller.signal)
        .then((results) => {
          if (!controller.signal.aborted) setState({ results: results.slice(0, MAX_SEARCH_RESULTS), loading: false, failure: null, slow: false });
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            setState({ results: [], loading: false, failure: classifySearchFailure(error), slow: false });
          }
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(slowId);
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, attempt]);

  return { check, ...state };
}
