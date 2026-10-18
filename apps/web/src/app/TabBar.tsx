export type View = 'saved' | 'search' | 'nearby' | 'board';

// The landing tab is first. Board is last because it shows a stop picked from one of the others.
const tabs: { view: View; label: string }[] = [
  { view: 'saved', label: 'Saved' },
  { view: 'search', label: 'Search' },
  { view: 'nearby', label: 'Nearby' },
  { view: 'board', label: 'Board' },
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
