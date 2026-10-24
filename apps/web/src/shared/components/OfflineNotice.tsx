import { useOnline } from '../hooks/useOnline';

export const OFFLINE_MESSAGE = "You're offline. Saved stops still open. Bus times return when you're back online.";

export function OfflineBanner() {
  return (
    <p className="advisory offline-notice" role="status">
      {OFFLINE_MESSAGE}
    </p>
  );
}

export function OfflineNotice() {
  return useOnline() ? null : <OfflineBanner />;
}
