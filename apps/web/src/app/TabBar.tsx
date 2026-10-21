import type { TabView } from './routes';

// The stop board is not a tab. It opens from a stop, and its back arrow returns to the tab it came from.
const tabs: { view: TabView; label: string }[] = [
  { view: 'saved', label: 'Saved' },
  { view: 'search', label: 'Search' },
  { view: 'nearby', label: 'Nearby' },
];

interface TabBarProps {
  view: TabView | 'board' | 'track';
  onChange: (view: TabView) => void;
}

export function TabBar({ view, onChange }: TabBarProps) {
  return (
    <nav className="tabbar" aria-label="Main">
      {tabs.map((tab) => (
        <button
          key={tab.view}
          type="button"
          className="tab"
          aria-current={view === tab.view ? 'page' : undefined}
          onClick={() => onChange(tab.view)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
