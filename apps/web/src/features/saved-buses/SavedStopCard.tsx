import type { BusStop } from '../../types/domain';
import { Freshness } from '../../shared/components/Freshness';
import { OperatorLogo } from '../../shared/components/OperatorLogo';
import { MoveButtons } from '../../shared/components/MoveButtons';
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
  onMoveBus: (stopCode: string, serviceNo: string, delta: -1 | 1) => void;
}

export function SavedStopCard({ group, state, now, onOpenStop, onRemoveBus, onMoveBus }: SavedStopCardProps) {
  const current = state ?? EMPTY_ARRIVALS;
  const rows = pickSavedServices(current.data, group.serviceNos);

  return (
    <article className="saved-stop" aria-label={`Saved buses at ${group.stopName}`}>
      <button type="button" className="saved-stop-open" onClick={() => onOpenStop(toBusStop(group))}>
        <span className="stop-code">{group.stopCode}</span>
        <span className="saved-stop-name">{group.stopName}</span>
        <span className="saved-stop-hint" aria-hidden="true">Open board ›</span>
      </button>
      <p className="caption">{group.roadName}</p>
      {current.data !== null && <Freshness fetchedAt={current.data.fetchedAt} now={now} />}

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
          {rows.map((row, index) => (
            <SavedBusRow
              key={row.serviceNo}
              row={row}
              now={now}
              stopCode={group.stopCode}
              canMoveUp={index > 0}
              canMoveDown={index < rows.length - 1}
              onRemove={onRemoveBus}
              onMove={onMoveBus}
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
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRemove: (stopCode: string, serviceNo: string) => void;
  onMove: (stopCode: string, serviceNo: string, delta: -1 | 1) => void;
}

function SavedBusRow({ row, now, stopCode, canMoveUp, canMoveDown, onRemove, onMove }: SavedBusRowProps) {
  const { serviceNo, service } = row;

  return (
    <li className="service-row">
      <div className="service-head">
        <span className="service-badge">{serviceNo}</span>
        {service && <OperatorLogo operator={service.operator} />}
        <MoveButtons
          label={`bus ${serviceNo}`}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onMove={(delta) => onMove(stopCode, serviceNo, delta)}
        />
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
