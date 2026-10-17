import { useMemo, useState } from 'react';
import { sampleStops } from '../../shared/services/sampleData';
import { EmptyState } from '../../shared/components/EmptyState';
import { SearchIcon } from '../../shared/components/Icons';
import { StopCard } from '../../shared/components/StopCard';

const MAX_RESULTS = 20;

interface SearchViewProps {
  onOpen: (stopCode: string) => void;
}

export function SearchView({ onOpen }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (term === '') return [];
    return sampleStops
      .filter(
        (s) =>
          s.busStopCode.startsWith(term) ||
          s.description.toLowerCase().includes(term) ||
          s.roadName.toLowerCase().includes(term),
      )
      .slice(0, MAX_RESULTS);
  }, [term]);

  // Stop codes are exactly 5 digits, so a longer numeric query is an input error.
  const codeError = /^\d+$/.test(term) && term.length > 5 ? 'Stop codes are 5 digits.' : null;

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

      {codeError && <p className="error" role="alert">{codeError}</p>}

      {term === '' && (
        <EmptyState icon={<SearchIcon size={24} />} message="Type a stop code or road to search." />
      )}

      {term !== '' && results.length === 0 && !codeError && (
        <EmptyState icon={<SearchIcon size={24} />} message={`No stops match "${query.trim()}".`} />
      )}

      {results.length > 0 && (
        <>
          <p className="caption">{results.length} result{results.length === 1 ? '' : 's'} (max {MAX_RESULTS})</p>
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
