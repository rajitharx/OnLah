import { useState } from 'react';
import type { BusStop } from '../../types/domain';
import { EmptyState } from '../../shared/components/EmptyState';
import { SearchIcon } from '../../shared/components/Icons';
import { StopCard } from '../../shared/components/StopCard';
import { useStopSearch } from './useStopSearch';
import { noMatchMessage, searchAnnouncement, searchFailureMessage } from './searchStatus';

interface SearchViewProps {
  query: string;
  onQueryChange: (query: string) => void;
  onOpen: (stop: BusStop) => void;
}

// The query lives in the app shell, so it survives a trip to another tab.
export function SearchView({ query, onQueryChange, onOpen }: SearchViewProps) {
  const [attempt, setAttempt] = useState(0);
  const search = useStopSearch(query, attempt);
  const { check, results, loading, failure } = search;
  const status = searchAnnouncement(search, results.length);
  const noMatch = check.kind === 'ok' && !loading && failure === null && results.length === 0;

  return (
    <section className="view" aria-labelledby="search-title">
      <h1 id="search-title" className="view-title">Search stops</h1>
      <label className="field">
        <span className="caption">Stop code or road name</span>
        <span className="search-field">
          <input
            className="search-input"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="e.g. 01012 or Victoria"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
          {query !== '' && (
            <button type="button" className="btn btn-quiet" onClick={() => onQueryChange('')} aria-label="Clear search">
              Clear
            </button>
          )}
        </span>
      </label>

      <p className={noMatch || status === '' ? 'sr-only' : 'caption'} role="status">{status}</p>
      {check.kind === 'code-too-long' && <p className="error" role="alert">Stop codes are 5 digits.</p>}
      {check.kind === 'too-short' && <p className="caption">Type at least 2 characters.</p>}
      {check.kind === 'empty' && (
        <EmptyState icon={<SearchIcon size={24} />} message="Type a stop code or road to search." />
      )}

      {failure !== null && (
        <div className="retry-notice">
          <p className="error" role="alert">{searchFailureMessage(failure)}</p>
          {failure === 'unavailable' && (
            <button type="button" className="btn" onClick={() => setAttempt((n) => n + 1)}>Try again</button>
          )}
        </div>
      )}

      {noMatch && <EmptyState icon={<SearchIcon size={24} />} message={noMatchMessage(check.term)} />}

      {results.length > 0 && (
        <>
          <div className="stop-list">
            {results.map((stop) => (
              <StopCard key={stop.busStopCode} stop={stop} onOpen={onOpen} highlight={check.kind === 'ok' ? check.term : ''} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
