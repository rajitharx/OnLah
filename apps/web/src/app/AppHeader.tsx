import type { MouseEvent } from 'react';
import type { ApiStatus } from '../shared/services/apiStatus';

const STATUS_LABEL: Record<ApiStatus, string> = {
  checking: 'Checking live data',
  good: 'Live data is online',
  slow: 'Live data is slow',
  down: 'Live data is offline',
};

interface AppHeaderProps {
  version: string;
  apiStatus: ApiStatus;
  // The wordmark goes home in the app, without a full page load.
  onHome: () => void;
}

export function AppHeader({ version, apiStatus, onHome }: AppHeaderProps) {
  const goHome = (event: MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault();
    onHome();
  };

  return (
    <header className="app-header">
      <div className="brand">
        <a className="wordmark" href="/" onClick={goHome}>
          OnLah <span className="wordmark-sub">Bus board</span>
        </a>
        <span
          className={`api-dot api-dot-${apiStatus}`}
          role="img"
          aria-label={STATUS_LABEL[apiStatus]}
          title={STATUS_LABEL[apiStatus]}
        />
      </div>
      <span className="app-version">{version}</span>
    </header>
  );
}
