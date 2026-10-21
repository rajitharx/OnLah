import type { BusArrival } from '../../types/domain';
import { OperatorLogo } from '../../shared/components/OperatorLogo';
import { StarIcon } from '../../shared/components/Icons';
import { EtaTile } from './EtaTile';

interface ServiceRowProps {
  service: BusArrival;
  now: number;
  onOpenService: (serviceNo: string) => void;
  isSaved: boolean;
  saveDisabled: boolean;
  onToggleSave: () => void;
  trackHref: string;
  onTrack: () => void;
}

export function ServiceRow({
  service,
  now,
  onOpenService,
  isSaved,
  saveDisabled,
  onToggleSave,
  trackHref,
  onTrack,
}: ServiceRowProps) {
  const timings = [service.nextBus, service.nextBus2, service.nextBus3];

  return (
    <li className="service-row">
      <div className="service-head">
        <button
          type="button"
          className="service-badge service-badge-button"
          onClick={() => onOpenService(service.serviceNo)}
          aria-label={`Bus ${service.serviceNo} details`}
        >
          {service.serviceNo}
        </button>
        <OperatorLogo operator={service.operator} />
        <a
          className="btn btn-quiet track-link"
          href={trackHref}
          aria-label={`Track bus ${service.serviceNo}`}
          onClick={(event) => {
            event.preventDefault();
            onTrack();
          }}
        >
          Track
        </a>
        <button
          type="button"
          className="icon-btn"
          aria-pressed={isSaved}
          aria-label={isSaved ? `Remove bus ${service.serviceNo} from saved buses` : `Save bus ${service.serviceNo}`}
          disabled={saveDisabled}
          onClick={onToggleSave}
        >
          <StarIcon size={16} filled={isSaved} />
        </button>
      </div>
      <div className="eta-grid">
        {timings.map((timing, index) => (
          <EtaTile key={index} timing={timing} now={now} />
        ))}
      </div>
    </li>
  );
}
