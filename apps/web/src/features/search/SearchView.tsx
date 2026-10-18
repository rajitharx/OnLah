import { useState } from 'react';
import type { BusStop } from '../../types/domain';
import { EmptyState } from '../../shared/components/EmptyState';
import { SearchIcon } from '../../shared/components/Icons';
import { StopCard } from '../../shared/components/StopCard';
import { useStopSearch } from './useStopSearch';

interface SearchViewProps {
  onOpen: (stop: BusStop) => void;
}

export function SearchView({ onOpen }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const { check, results, loading, failed } = useStopSearch(query);

  return (
    <section className="view" aria-labelledby="search-title">
      <h1 id="search-title" className="view-title">Search stops</h1>
      <label className="field">
        <span className="caption">Stop code or road name</span>
        <input
          className="search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 01012 or Victoria"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
        />
      </label>

      {check.kind === 'code-too-long' && <p className="error" role="alert">Stop codes are 5 digits.</p>}
      {check.kind === 'too-short' && <p className="caption">Type at least 2 characters.</p>}
      {check.kind === 'empty' && (
        <EmptyState icon={<SearchIcon size={24} />} message="Type a stop code or road to search." />
      )}

      {failed && <p className="error" role="alert">Search is unavailable right now. Try again.</p>}

      {check.kind === 'ok' && !loading && !failed && results.length === 0 && (
        <EmptyState icon={<SearchIcon size={24} />} message={`No stops match "${check.term}".`} />
      )}

      {results.length > 0 && (
        <>
          <p className="caption">{results.length} result{results.length === 1 ? '' : 's'} (max 20)</p>
          <div className="stop-list">
            {results.map((stop) => (
              <StopCard key={stop.busStopCode} stop={stop} onOpen={onOpen} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
