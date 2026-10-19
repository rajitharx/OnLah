import { crowdBarCount, crowdClass } from '../utils/arrival';
import type { CrowdLevel } from '../../types/domain';

// Bars fill with the crowd colour. The level is also spelled out in the tile's label and in the legend.
export function CrowdBars({ level }: { level: CrowdLevel }) {
  const filled = crowdBarCount(level);
  return (
    <span className={`crowd-bars ${crowdClass(level)}`} aria-hidden="true">
      {[1, 2, 3].map((bar) => (
        <span key={bar} className={bar <= filled ? 'crowd-bar crowd-bar-on' : 'crowd-bar'} />
      ))}
    </span>
  );
}
