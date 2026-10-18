export type View = 'board' | 'search' | 'nearby' | 'favourites';

const tabs: { view: View; label: string }[] = [
  { view: 'favourites', label: 'Saved' },
  { view: 'board', label: 'Board' },
  { view: 'search', label: 'Search' },
  { view: 'nearby', label: 'Nearby' },
];

interface TabBarProps {
  view: View;
  onChange: (view: View) => void;
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
