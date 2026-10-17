import type { ReactNode } from 'react';
import type { BusStop } from '../../types/domain';
import { formatDistance } from '../utils/geo';

interface StopCardProps {
  stop: BusStop;
  distanceMeters?: number;
  onOpen: (stop: BusStop) => void;
  action?: ReactNode;
}

// A stop row. The main button opens the board; `action` sits beside it, for example a remove button.
export function StopCard({ stop, distanceMeters, onOpen, action }: StopCardProps) {
  const road = distanceMeters === undefined ? stop.roadName : `${stop.roadName} · ${formatDistance(distanceMeters)}`;

  return (
    <div className="stop-row">
      <button type="button" className="stop-card" onClick={() => onOpen(stop)}>
        <span className="stop-code">{stop.busStopCode}</span>
        <span className="stop-card-text">
          <span className="stop-card-name">{stop.description}</span>
          <span className="stop-card-road">{road}</span>
        </span>
      </button>
      {action}
    </div>
  );
}
