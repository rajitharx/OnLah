import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  message: string;
}

// Always shown in place of an empty list, never a blank area.
export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="empty">
      <span className="empty-icon">{icon}</span>
      <p className="empty-text">{message}</p>
    </div>
  );
}
