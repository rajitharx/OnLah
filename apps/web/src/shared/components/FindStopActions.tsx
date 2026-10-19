import { SearchIcon } from './Icons';

interface FindStopActionsProps {
  onNavigate: (view: 'search' | 'nearby') => void;
}

// The two ways to find a stop, offered wherever a list is empty.
export function FindStopActions({ onNavigate }: FindStopActionsProps) {
  return (
    <>
      <button type="button" className="btn" onClick={() => onNavigate('search')}>
        <SearchIcon size={14} />
        Search stops
      </button>
      <button type="button" className="btn" onClick={() => onNavigate('nearby')}>
        Find nearby
      </button>
    </>
  );
}
