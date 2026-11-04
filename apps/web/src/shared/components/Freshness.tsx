import { useNow } from '../hooks/useNow';
import { secondsSince } from '../utils/arrival';

interface FreshnessProps {
  fetchedAt: string;
  label?: string;
  // A stale chip says so in words, so the state never rests on colour alone.
  stale?: boolean;
}

// Shows how old the data is. It replaces a loading spinner on silent refresh.
export function Freshness({ fetchedAt, label = 'Updated', stale = false }: FreshnessProps) {
  const seconds = secondsSince(fetchedAt, useNow());
  return (
    <p className={stale ? 'freshness freshness-stale' : 'freshness'}>
      <span className="live-dot" aria-hidden="true" />
      {`${stale ? 'Stale · ' : ''}${label} ${seconds}s ago`}
    </p>
  );
}
