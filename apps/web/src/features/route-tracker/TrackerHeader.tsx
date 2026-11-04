import { Freshness } from '../../shared/components/Freshness';
import { PinIcon } from '../../shared/components/Icons';
import type { RouteTracker } from '../../types/routeTracker';

interface TrackerHeaderProps {
  tracker: RouteTracker;
  stale: boolean;
  showAge: boolean;
}

export function TrackerHeader({ tracker, stale, showAge }: TrackerHeaderProps) {
  const userStop = tracker.stops[tracker.userStopIndex];

  return (
    <header className="tracker-head">
      <span className="service-badge">{tracker.serviceNo}</span>
      <div className="tracker-title">
        <h1 className="tracker-to">To {tracker.destination.description}</h1>
        <p className="tracker-stop">
          <PinIcon size={14} />
          {userStop.description}
          <span className="tracker-stop-code">{userStop.busStopCode}</span>
        </p>
      </div>
      {showAge && <Freshness fetchedAt={tracker.fetchedAt} stale={stale} />}
    </header>
  );
}
