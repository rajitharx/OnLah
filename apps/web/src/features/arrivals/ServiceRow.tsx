import type { BusArrival } from '../../types/domain';
import { OperatorLogo } from '../../shared/components/OperatorLogo';
import { StarIcon } from '../../shared/components/Icons';
import { EtaTile } from './EtaTile';
import { groupByDirection } from './directions';

interface ServiceRowProps {
  service: BusArrival;
  onOpenService: (serviceNo: string) => void;
  isSaved: boolean;
  saveDisabled: boolean;
  onToggleSave: () => void;
  trackHref: string;
  onTrack: () => void;
}

export function ServiceRow({
  service,
  onOpenService,
  isSaved,
  saveDisabled,
  onToggleSave,
  trackHref,
  onTrack,
}: ServiceRowProps) {
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
      {groupByDirection(service).map((group) => (
        <div className="service-direction" key={group.routes.map((route) => route.destinationCode).join('|')}>
          {group.routes.map((route) => (
            <p
              className="service-route"
              key={`${route.origin}>${route.destination}`}
              aria-label={`From ${route.origin} to ${route.destination}`}
            >
              <span>{route.origin}</span>
              <span aria-hidden="true">→</span>
              <span>{route.destination}</span>
            </p>
          ))}
          <div className="eta-grid">
            {group.timings.map((timing, index) => (
              <EtaTile key={index} timing={timing} />
            ))}
          </div>
        </div>
      ))}
    </li>
  );
}
