import { useEffect, useState } from 'react';
import type { BusStop } from '../../types/domain';
import { api } from '../../shared/services/onlahApi';
import { checkSearchQuery, type SearchQueryCheck } from '../../shared/utils/search';

const DEBOUNCE_MS = 250;

export interface StopSearchState {
  check: SearchQueryCheck;
  results: BusStop[];
  loading: boolean;
  failed: boolean;
}

// Debounces typing so each keystroke does not hit the backend.
export function useStopSearch(query: string): StopSearchState {
  const check = checkSearchQuery(query);
  const term = check.kind === 'ok' ? check.term : null;
  const [state, setState] = useState<Omit<StopSearchState, 'check'>>({ results: [], loading: false, failed: false });

  useEffect(() => {
    if (term === null) {
      setState({ results: [], loading: false, failed: false });
      return;
    }

    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, failed: false }));
    const timer = window.setTimeout(() => {
      api
        .searchBusStops(term, controller.signal)
        .then((results) => {
          if (!controller.signal.aborted) setState({ results, loading: false, failed: false });
        })
        .catch(() => {
          if (!controller.signal.aborted) setState({ results: [], loading: false, failed: true });
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  return { check, ...state };
}
