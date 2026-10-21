import type { MouseEvent } from 'react';

interface AppHeaderProps {
  version: string;
  // The wordmark goes home in the app, without a full page load.
  onHome: () => void;
}

export function AppHeader({ version, onHome }: AppHeaderProps) {
  const goHome = (event: MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault();
    onHome();
  };

  return (
    <header className="app-header">
      <a className="wordmark" href="/" onClick={goHome}>
        OnLah <span className="wordmark-sub">Bus board</span>
      </a>
      <span className="app-version">{version}</span>
    </header>
  );
}
