import type { ReactNode } from 'react';
import type { BusStop } from '../../types/domain';
import { formatDistance } from '../utils/geo';
import { highlightParts } from '../utils/highlight';

interface StopCardProps {
  stop: BusStop;
  distanceMeters?: number;
  onOpen: (stop: BusStop) => void;
  action?: ReactNode;
  // The search term, bolded wherever it appears in the stop's name.
  highlight?: string;
}

// A stop row. The main button opens the board; `action` sits beside it, for example a remove button.
export function StopCard({ stop, distanceMeters, onOpen, action, highlight = '' }: StopCardProps) {
  const road = distanceMeters === undefined ? stop.roadName : `${stop.roadName} · ${formatDistance(distanceMeters)}`;

  return (
    <div className="stop-row">
      <button type="button" className="stop-card" onClick={() => onOpen(stop)}>
        <span className="stop-code">{stop.busStopCode}</span>
        <span className="stop-card-text">
          <span className="stop-card-name">
            <Highlighted text={stop.description} term={highlight} />
          </span>
          <span className="stop-card-road">{road}</span>
        </span>
      </button>
      {action}
    </div>
  );
}

function Highlighted({ text, term }: { text: string; term: string }) {
  return (
    <>
      {highlightParts(text, term).map((part, index) =>
        part.match ? <strong key={index} className="match">{part.text}</strong> : <span key={index}>{part.text}</span>,
      )}
    </>
  );
}
