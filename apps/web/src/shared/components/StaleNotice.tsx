import { secondsSince } from '../utils/arrival';

interface StaleNoticeProps {
  fetchedAt: string;
  now: number;
  onRetry: () => void;
  // Several notices can show at once, such as one per saved stop, so those use 'status' instead of interrupting.
  tone?: 'alert' | 'status';
}

export function StaleNotice({ fetchedAt, now, onRetry, tone = 'alert' }: StaleNoticeProps) {
  return (
    <div className="stale-notice">
      <p className="stale-notice-text" role={tone}>Couldn't refresh.</p>
      <p className="stale-notice-text">{`Showing data from ${secondsSince(fetchedAt, now)}s ago.`}</p>
      <button type="button" className="btn" onClick={onRetry}>Try again</button>
    </div>
  );
}
