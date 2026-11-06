import { useCallback, useRef, useState } from 'react';
import { BusStop } from '../../types/domain';
import { searchBusStops } from '../../shared/services/onlahApi';

interface SearchState {
  results: BusStop[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
}

interface UseSearchBusStops extends SearchState {
  search: (query: string) => void;
  clear: () => void;
}

export function useSearchBusStops(): UseSearchBusStops {
  const [state, setState] = useState<SearchState>({
    results: [],
    isLoading: false,
    error: null,
    hasSearched: false,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Only the newest request may set results, so a slow older one cannot overwrite them.
  const requestRef = useRef(0);

  const search = useCallback((query: string): void => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const requestId = ++requestRef.current;

    if (query.trim().length < 2) {
      setState({ results: [], isLoading: false, error: null, hasSearched: false });
      return;
    }

    // Results from the previous query stay until the new ones arrive.
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchBusStops(query.trim());
        if (requestId !== requestRef.current) return;
        setState({ results, isLoading: false, error: null, hasSearched: true });
      } catch {
        if (requestId !== requestRef.current) return;
        setState({ results: [], isLoading: false, error: 'Search failed. Try again.', hasSearched: true });
      }
    }, 300);
  }, []);

  const clear = useCallback((): void => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    requestRef.current++;
    setState({ results: [], isLoading: false, error: null, hasSearched: false });
  }, []);

  return { ...state, search, clear };
}
