import type { CrowdLevel } from '../../types/domain';
import { crowdClass, crowdLabel } from '../../shared/utils/arrival';
import { WheelchairIcon } from '../../shared/components/Icons';

const CROWD_LEVELS: CrowdLevel[] = [0, 1, 2];

// Explains the crowd colours and the no-wheelchair-access mark on the tiles below.
export function BoardLegend() {
  return (
    <ul className="legend" aria-label="How to read the times">
      {CROWD_LEVELS.map((level) => (
        <li key={level} className="legend-item">
          <span className={`legend-swatch ${crowdClass(level)}`} aria-hidden="true" />
          {crowdLabel(level)}
        </li>
      ))}
      <li className="legend-item">
        <WheelchairIcon size={12} crossed />
        Not wheelchair accessible
      </li>
    </ul>
  );
}
