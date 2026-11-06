import './routeTracker.css';
import { useNow } from '../../shared/hooks/useNow';
import { TrackerContent } from './TrackerContent';
import { isStale } from './trackerState';
import { useRouteTracker } from './useRouteTracker';

interface RouteTrackerViewProps {
  stopCode: string;
  serviceNo: string;
  destinationCode?: string;
  onBack: () => void;
}

// One service at one stop, from /track/:busStopCode/:serviceNo. The page also works as a direct link.
export function RouteTrackerView({ stopCode, serviceNo, destinationCode, onBack }: RouteTrackerViewProps) {
  const { retry, ...state } = useRouteTracker(stopCode, serviceNo, destinationCode);
  const now = useNow();

  return (
    <section className="tracker" aria-label={`Route tracker for bus ${serviceNo}`}>
      <button type="button" className="btn btn-quiet board-back" onClick={onBack}>← Back</button>
      <TrackerContent
        state={state}
        stopCode={stopCode}
        serviceNo={serviceNo}
        stale={isStale(state, now)}
        onRetry={retry}
      />
    </section>
  );
}
