interface BoardSkeletonProps {
  label: string;
  // Rows shown under the header, one per bus service.
  rows?: number;
  // Leave the header out when the real stop header is already on screen.
  header?: boolean;
}

// Grey placeholders in the shape of a board: a header and service rows. It reserves the space the times will fill.
export function BoardSkeleton({ label, rows = 3, header = true }: BoardSkeletonProps) {
  return (
    <div className="board-skeleton" aria-busy="true" role="status" aria-label={label}>
      {header && <span className="skeleton-block board-skeleton-head" />}
      {Array.from({ length: rows }, (_, index) => (
        <span className="skeleton-block board-skeleton-row" key={index} />
      ))}
    </div>
  );
}
