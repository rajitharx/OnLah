import { crowdClass, crowdLabel } from '../../shared/utils/arrival';
import type { TrackedBus } from '../../types/routeTracker';
import { crowdLevelOf } from './trackerLabels';

// Colour plus a word, so the crowd level never depends on colour alone.
export function CrowdBadge({ load }: { load: TrackedBus['load'] }) {
  const level = crowdLevelOf(load);
  return (
    <span className="crowd-badge">
      <span className={`legend-swatch ${crowdClass(level)}`} aria-hidden="true" />
      {crowdLabel(level)}
    </span>
  );
}
