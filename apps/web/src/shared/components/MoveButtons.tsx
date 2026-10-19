interface MoveButtonsProps {
  // Names the item for screen readers, as in "Move Aft Victoria Lane up".
  label: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (delta: -1 | 1) => void;
}

// Up and down buttons for a saved list. Everyone's commute order is different.
export function MoveButtons({ label, canMoveUp, canMoveDown, onMove }: MoveButtonsProps) {
  return (
    <span className="move-buttons">
      <button
        type="button"
        className="icon-btn move-btn"
        disabled={!canMoveUp}
        aria-label={`Move ${label} up`}
        onClick={() => onMove(-1)}
      >
        ↑
      </button>
      <button
        type="button"
        className="icon-btn move-btn"
        disabled={!canMoveDown}
        aria-label={`Move ${label} down`}
        onClick={() => onMove(1)}
      >
        ↓
      </button>
    </span>
  );
}
