import { secondsSince } from '../utils/arrival';

interface StaleNoticeProps {
  fetchedAt: string;
  now: number;
  onRetry: () => void;
}

export function StaleNotice({ fetchedAt, now, onRetry }: StaleNoticeProps) {
  return (
    <div className="stale-notice">
      <p className="stale-notice-text" role="alert">Couldn't refresh.</p>
      <p className="stale-notice-text">{`Showing data from ${secondsSince(fetchedAt, now)}s ago.`}</p>
      <button type="button" className="btn" onClick={onRetry}>Try again</button>
    </div>
  );
}
