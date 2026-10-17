import type { ArrivalTiming } from '../../types/domain';
import { busTypeLabel, crowdLabel, minutesUntil } from '../../shared/utils/arrival';
import { CrowdBadge } from '../../shared/components/CrowdBadge';
import { WheelchairIcon } from '../../shared/components/Icons';

interface EtaTileProps {
  timing: ArrivalTiming | null;
  now: number;
}

// One split-flap tile: the ETA in minutes, then crowd level, bus type and wheelchair access.
export function EtaTile({ timing, now }: EtaTileProps) {
  if (timing === null) {
    return (
      <div className="eta-tile eta-tile-empty" role="group" aria-label="No bus due">
        <span className="eta-value eta-value-empty">—</span>
        <span className="eta-foot">No bus</span>
      </div>
    );
  }

  const minutes = minutesUntil(timing.estimatedArrival, now);
  const arriving = minutes === 0;
  const type = busTypeLabel(timing.type);
  const accessible = timing.isWheelchairAccessible;
  const spoken = `${arriving ? 'Arriving' : `${minutes} minutes`}, ${crowdLabel(timing.load)}, ${type}${accessible ? ', wheelchair accessible' : ''}`;

  return (
    <div className="eta-tile" role="group" aria-label={spoken}>
      <span className="eta-value">{arriving ? 'Arr' : minutes}</span>
      {!arriving && <span className="eta-unit">min</span>}
      <CrowdBadge level={timing.load} />
      <span className="eta-foot">
        {type}
        {accessible && (
          <>
            <span aria-hidden="true"> · </span>
            <WheelchairIcon size={12} />
          </>
        )}
      </span>
    </div>
  );
}
