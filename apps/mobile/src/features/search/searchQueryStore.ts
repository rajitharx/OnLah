import { create } from 'zustand';

interface SearchQueryState {
  query: string;
  setQuery: (query: string) => void;
}

// The query lives outside the screen, so it survives a trip to another tab.
export function createSearchQueryStore() {
  return create<SearchQueryState>()((set) => ({ query: '', setQuery: (query) => set({ query }) }));
}

export const useSearchQueryStore = createSearchQueryStore();
