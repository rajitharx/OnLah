import { ClockIcon, WheelchairIcon } from '../../shared/components/Icons';
import { busTypeLabel } from '../../shared/utils/arrival';
import type { TrackedBus } from '../../types/routeTracker';
import { deckTypeOf } from './trackerLabels';

// The small facts about one bus: how it is tracked, its deck, and wheelchair access. Each has text for screen readers.
export function BusMarks({ bus }: { bus: TrackedBus }) {
  return (
    <>
      {!bus.monitored && (
        <span className="bus-mark" data-icon="clock">
          <ClockIcon size={12} />
          Scheduled
        </span>
      )}
      <span className="bus-mark">{busTypeLabel(deckTypeOf(bus.type))}</span>
      {bus.feature === 'WAB' && (
        <span className="bus-mark" role="img" aria-label="Wheelchair accessible">
          <WheelchairIcon size={12} />
        </span>
      )}
    </>
  );
}
