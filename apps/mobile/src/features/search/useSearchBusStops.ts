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

  const search = useCallback((query: string): void => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setState({ results: [], isLoading: false, error: null, hasSearched: false });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchBusStops(query.trim());
        setState({ results, isLoading: false, error: null, hasSearched: true });
      } catch {
        setState({ results: [], isLoading: false, error: 'Search failed. Try again.', hasSearched: true });
      }
    }, 300);
  }, []);

  const clear = useCallback((): void => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setState({ results: [], isLoading: false, error: null, hasSearched: false });
  }, []);

  return { ...state, search, clear };
}
