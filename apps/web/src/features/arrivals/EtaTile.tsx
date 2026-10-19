import type { ArrivalTiming, BusType } from '../../types/domain';
import { busTypeLabel, crowdLabel, minutesUntil } from '../../shared/utils/arrival';
import { CrowdBars } from '../../shared/components/CrowdBars';
import { DoubleDeckIcon, SingleDeckIcon, WheelchairIcon } from '../../shared/components/Icons';

interface EtaTileProps {
  timing: ArrivalTiming | null;
  now: number;
  // The first tile is the next bus, so it is drawn larger.
  next: boolean;
}

// One split-flap tile: the ETA in minutes, then crowd bars, bus type and wheelchair access.
export function EtaTile({ timing, now, next }: EtaTileProps) {
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
  const tileClass = next ? 'eta-tile eta-tile-next' : 'eta-tile';

  return (
    <div className={tileClass} role="group" aria-label={spoken}>
      <span className="eta-value">{arriving ? 'Arr' : minutes}</span>
      {!arriving && <span className="eta-unit">min</span>}
      <span className="eta-foot">
        <CrowdBars level={timing.load} />
        <BusTypeMark type={timing.type} label={type} />
        {accessible && <WheelchairIcon size={12} />}
      </span>
    </div>
  );
}

// Single and double deck show an icon and their label, so the two never look alike. Bendy keeps the text label.
function BusTypeMark({ type, label }: { type: BusType; label: string }) {
  if (type === 0) return <span className="eta-type"><SingleDeckIcon size={12} />{label}</span>;
  if (type === 1) return <span className="eta-type"><DoubleDeckIcon size={12} />{label}</span>;
  return <span className="eta-type">{label}</span>;
}
