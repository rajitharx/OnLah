import { secondsSince } from '../utils/arrival';

interface FreshnessProps {
  fetchedAt: string;
  now: number;
  label?: string;
}

// Shows how old the data is. It replaces a loading spinner on silent refresh.
export function Freshness({ fetchedAt, now, label = 'Updated' }: FreshnessProps) {
  const seconds = secondsSince(fetchedAt, now);
  return (
    <p className="freshness">
      <span className="live-dot" aria-hidden="true" />
      {`${label} ${seconds}s ago`}
    </p>
  );
}
