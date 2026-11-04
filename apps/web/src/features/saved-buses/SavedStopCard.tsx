import type { BusStop } from '../../types/domain';
import { Freshness } from '../../shared/components/Freshness';
import { OperatorLogo } from '../../shared/components/OperatorLogo';
import { StarIcon } from '../../shared/components/Icons';
import { ResyncButton } from '../../shared/components/ResyncButton';
import { StaleNotice } from '../../shared/components/StaleNotice';
import { EtaTile } from '../arrivals/EtaTile';
import { EMPTY_ARRIVALS, type ArrivalsState } from '../arrivals/arrivalsState';
import { hasBusesDue, pickSavedServices, toBusStop, type SavedStopGroup, type SavedServiceRow } from './savedBusView';

interface SavedStopCardProps {
  group: SavedStopGroup;
  state: ArrivalsState | undefined;
  now: number;
  onOpenStop: (stop: BusStop) => void;
  onOpenService: (stop: BusStop, serviceNo: string) => void;
  onRemoveBus: (stopCode: string, serviceNo: string) => void;
  onResync: (stopCode: string) => void;
}

export function SavedStopCard({ group, state, now, onOpenStop, onOpenService, onRemoveBus, onResync }: SavedStopCardProps) {
  const current = state ?? EMPTY_ARRIVALS;
  const rows = pickSavedServices(current.data, group.serviceNos);
  const stop = toBusStop(group);

  return (
    <article className="saved-stop" aria-label={`Saved buses at ${group.stopName}`}>
      <div className="saved-stop-head">
        <button type="button" className="saved-stop-open" onClick={() => onOpenStop(stop)}>
          <span className="stop-code">{group.stopCode}</span>
          <span className="saved-stop-name">{group.stopName}</span>
          <span className="saved-stop-hint" aria-hidden="true">Open board ›</span>
        </button>
        <ResyncButton label={`Re-sync ${group.stopName}`} onClick={() => onResync(group.stopCode)} />
      </div>
      <p className="caption">{group.roadName}</p>
      {current.data !== null && !current.failed && <Freshness fetchedAt={current.data.fetchedAt} now={now} />}

      {current.data !== null && current.failed && (
        <StaleNotice fetchedAt={current.data.fetchedAt} now={now} onRetry={() => onResync(group.stopCode)} tone="status" />
      )}
      {!current.data && current.failed && (
        <p className="error" role="status">Bus times are unavailable right now.</p>
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
              stop={stop}
              onOpenService={onOpenService}
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
  stop: BusStop;
  onOpenService: (stop: BusStop, serviceNo: string) => void;
  onRemove: (stopCode: string, serviceNo: string) => void;
}

function SavedBusRow({ row, now, stop, onOpenService, onRemove }: SavedBusRowProps) {
  const { serviceNo, service } = row;

  return (
    <li className="service-row">
      <div className="service-head">
        <button
          type="button"
          className="service-badge service-badge-button"
          onClick={() => onOpenService(stop, serviceNo)}
          aria-label={`Bus ${serviceNo} details`}
        >
          {serviceNo}
        </button>
        {service && <OperatorLogo operator={service.operator} />}
        <button
          type="button"
          className="icon-btn"
          onClick={() => onRemove(stop.busStopCode, serviceNo)}
          aria-label={`Remove bus ${serviceNo} from saved buses`}
        >
          <StarIcon size={16} filled />
        </button>
      </div>
      {hasBusesDue(service) && service ? (
        <div className="eta-grid">
          {[service.nextBus, service.nextBus2, service.nextBus3].map((timing, index) => (
            <EtaTile key={index} timing={timing} now={now} />
          ))}
        </div>
      ) : (
        <p className="caption">No buses due right now.</p>
      )}
    </li>
  );
}
