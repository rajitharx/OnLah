import './routeTracker.css';
import { TrackerContent } from './TrackerContent';
import { isStale } from './trackerState';
import { useRouteTracker } from './useRouteTracker';

interface RouteTrackerViewProps {
  stopCode: string;
  serviceNo: string;
  now: number;
  onBack: () => void;
}

// One service at one stop, from /track/:busStopCode/:serviceNo. The page also works as a direct link.
export function RouteTrackerView({ stopCode, serviceNo, now, onBack }: RouteTrackerViewProps) {
  const { retry, ...state } = useRouteTracker(stopCode, serviceNo);

  return (
    <section className="tracker" aria-label={`Route tracker for bus ${serviceNo}`}>
      <button type="button" className="btn btn-quiet board-back" onClick={onBack}>← Back</button>
      <TrackerContent
        state={state}
        stopCode={stopCode}
        serviceNo={serviceNo}
        now={now}
        stale={isStale(state, now)}
        onRetry={retry}
      />
    </section>
  );
}
