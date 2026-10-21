import type { TrackedBus, TrackerStatus } from '../../types/routeTracker';
import { BusMarks } from './BusMarks';
import { CrowdBadge } from './CrowdBadge';
import { statusMessage, stopsAwayLabel } from './trackerLabels';

// The hero: how many stops away the next bus is. Without a position it shows the ETA alone, never a guessed count.
export function Countdown({ bus }: { bus: TrackedBus }) {
  const stopsText = stopsAwayLabel(bus.stopsAway, bus.etaLabel);

  return (
    <section className="tracker-hero" aria-label="Next bus">
      <div aria-live="polite">
        <p className="hero-count">{stopsText ?? bus.etaLabel}</p>
        <p className="hero-eta">
          {stopsText === null ? positionNote(bus) : `ETA ${etaText(bus)}`}
        </p>
      </div>
      <p className="hero-meta">
        <CrowdBadge load={bus.load} />
        <BusMarks bus={bus} />
      </p>
    </section>
  );
}

function etaText(bus: TrackedBus): string {
  return bus.etaLabel === 'Arr' ? 'under 1 min' : bus.etaLabel;
}

function positionNote(bus: TrackedBus): string {
  return bus.monitored ? 'Position not available, showing the ETA only' : 'Timetable estimate';
}

// With no bus to count down, say why in LTA's own terms.
export function EmptyCountdown({ status }: { status: TrackerStatus }) {
  const message = statusMessage(status);
  if (message === null) return null;

  return (
    <section className="tracker-hero tracker-hero-empty" aria-label="Next bus">
      <div aria-live="polite">
        <p className="hero-count">{message.title}</p>
        <p className="hero-eta">{message.detail}</p>
      </div>
    </section>
  );
}
