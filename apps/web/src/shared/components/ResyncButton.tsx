import { RecycleIcon } from './Icons';

interface ResyncButtonProps {
  // Names the thing being refreshed, since the icon has no text.
  label: string;
  onClick: () => void;
}

// One control for every refresh: the stop board, saved stops and saved buses.
export function ResyncButton({ label, onClick }: ResyncButtonProps) {
  return (
    <button type="button" className="icon-btn resync-btn" onClick={onClick} aria-label={label} title={label}>
      <RecycleIcon size={18} />
    </button>
  );
}
