import type { BusType, CrowdLevel } from '../../types/domain';
import { busTypeLabel, busTypeName, crowdClass, crowdLabel } from '../../shared/utils/arrival';
import { DoubleDeckIcon, SingleDeckIcon, WheelchairIcon } from '../../shared/components/Icons';

const CROWD_LEVELS: CrowdLevel[] = [0, 1, 2];
const BUS_TYPES: BusType[] = [0, 1];

// Explains the bars, the deck icons and the wheelchair mark on the tiles below.
export function BoardLegend() {
  return (
    <ul className="legend" aria-label="How to read the times">
      {CROWD_LEVELS.map((level) => (
        <li key={level} className="legend-item">
          <span className={`legend-swatch ${crowdClass(level)}`} aria-hidden="true" />
          {crowdLabel(level)}
        </li>
      ))}
      {BUS_TYPES.map((type) => (
        <li key={type} className="legend-item">
          {type === 0 ? <SingleDeckIcon size={12} /> : <DoubleDeckIcon size={12} />}
          {busTypeLabel(type)} {busTypeName(type)}
        </li>
      ))}
      <li className="legend-item">
        <WheelchairIcon size={12} />
        Wheelchair accessible
      </li>
    </ul>
  );
}
