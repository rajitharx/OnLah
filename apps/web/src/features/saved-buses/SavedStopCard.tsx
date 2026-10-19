import type { BusStop } from '../../types/domain';
import { OperatorLogo } from '../../shared/components/OperatorLogo';
import { StarIcon } from '../../shared/components/Icons';
import { EtaTile } from '../arrivals/EtaTile';
import { EMPTY_ARRIVALS, type ArrivalsState } from '../arrivals/arrivalsState';
import { hasBusesDue, pickSavedServices, toBusStop, type SavedStopGroup, type SavedServiceRow } from './savedBusView';

interface SavedStopCardProps {
  group: SavedStopGroup;
  state: ArrivalsState | undefined;
  now: number;
  onOpenStop: (stop: BusStop) => void;
  onRemoveBus: (stopCode: string, serviceNo: string) => void;
}

export function SavedStopCard({ group, state, now, onOpenStop, onRemoveBus }: SavedStopCardProps) {
  const current = state ?? EMPTY_ARRIVALS;
  const rows = pickSavedServices(current.data, group.serviceNos);

  return (
    <article className="saved-stop" aria-label={`Saved buses at ${group.stopName}`}>
      <button type="button" className="saved-stop-open" onClick={() => onOpenStop(toBusStop(group))}>
        <span className="stop-code">{group.stopCode}</span>
        <span className="saved-stop-name">{group.stopName}</span>
      </button>
      <p className="caption">{group.roadName}</p>

      {!current.data && current.failed && (
        <p className="error" role="alert">Bus times are unavailable right now.</p>
      )}
      {!current.data && !current.failed && (
        <p className="caption" role="status">
          {current.slow ? 'Waking up the server… the first load can take up to a minute.' : 'Loading bus times…'}
        </p>
      )}
      {current.data !== null && (
        <ul className="service-list" aria-label={`Saved bus services at ${group.stopName}`}>
          {rows.map((row) => (
            <SavedBusRow
              key={row.serviceNo}
              row={row}
              now={now}
              stopCode={group.stopCode}
              onRemove={onRemoveBus}
            />
          ))}
        </ul>
      )}
    </article>
  );
}

interface SavedBusRowProps {
  row: SavedServiceRow;
  now: number;
  stopCode: string;
  onRemove: (stopCode: string, serviceNo: string) => void;
}

function SavedBusRow({ row, now, stopCode, onRemove }: SavedBusRowProps) {
  const { serviceNo, service } = row;

  return (
    <li className="service-row">
      <div className="service-head">
        <span className="service-badge">{serviceNo}</span>
        {service && <OperatorLogo operator={service.operator} />}
        <button
          type="button"
          className="icon-btn"
          onClick={() => onRemove(stopCode, serviceNo)}
          aria-label={`Remove bus ${serviceNo} from saved buses`}
        >
          <StarIcon size={16} filled />
        </button>
      </div>
      {hasBusesDue(service) && service ? (
        <div className="eta-grid">
          {[service.nextBus, service.nextBus2, service.nextBus3].map((timing, index) => (
            <EtaTile key={index} timing={timing} now={now} next={index === 0} />
          ))}
        </div>
      ) : (
        <p className="caption">No buses due right now.</p>
      )}
    </li>
  );
}
