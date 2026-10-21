import type { TrackedBus } from '../../types/routeTracker';
import { BusMarks } from './BusMarks';
import { CrowdBadge } from './CrowdBadge';
import { stopsAwayLabel } from './trackerLabels';

// The second and third buses. Empty slots are never passed in, so nothing blank is drawn.
export function NextBusStrip({ buses }: { buses: TrackedBus[] }) {
  if (buses.length === 0) return null;

  return (
    <section className="later-buses" aria-label="Later buses">
      <h2 className="label">Later buses</h2>
      <ul className="later-list">
        {buses.map((bus) => (
          <li key={bus.estimatedArrival} className="later-bus">
            <span className="later-eta">{bus.etaLabel}</span>
            <CrowdBadge load={bus.load} />
            <BusMarks bus={bus} />
            <span className="later-stops">{stopsAwayLabel(bus.stopsAway, bus.etaLabel)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
