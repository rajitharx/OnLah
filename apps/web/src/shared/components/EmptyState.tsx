import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  message: string;
  // A next step, such as a button to the screen that fills the list.
  action?: ReactNode;
}

// Always shown in place of an empty list, never a blank area.
export function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <span className="empty-icon">{icon}</span>
      <p className="empty-text">{message}</p>
      {action !== undefined && <div className="empty-actions">{action}</div>}
    </div>
  );
}
