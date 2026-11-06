import type { BusStop } from '../../types/domain';
import { Freshness } from '../../shared/components/Freshness';
import { StarIcon } from '../../shared/components/Icons';
import { ResyncButton } from '../../shared/components/ResyncButton';
import { StaleNotice } from '../../shared/components/StaleNotice';
import { EtaTile } from '../arrivals/EtaTile';
import { ServiceRow } from '../arrivals/ServiceRow';
import { EMPTY_ARRIVALS, type ArrivalsState } from '../arrivals/arrivalsState';
import { pickSavedServices, toBusStop, type SavedStopGroup, type SavedServiceRow } from './savedBusView';

interface SavedStopCardProps {
  group: SavedStopGroup;
  state: ArrivalsState | undefined;
  onOpenStop: (stop: BusStop) => void;
  onOpenService: (stop: BusStop, serviceNo: string) => void;
  onRemoveBus: (stopCode: string, serviceNo: string) => void;
  trackHref: (stopCode: string, serviceNo: string) => string;
  onTrack: (stopCode: string, serviceNo: string) => void;
  onResync: (stopCode: string) => void;
}

export function SavedStopCard({ group, state, onOpenStop, onOpenService, onRemoveBus, trackHref, onTrack, onResync }: SavedStopCardProps) {
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
      {current.data !== null && !current.failed && <Freshness fetchedAt={current.data.fetchedAt} />}

      {current.data !== null && current.failed && (
        <StaleNotice fetchedAt={current.data.fetchedAt} onRetry={() => onResync(group.stopCode)} tone="status" />
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
              stop={stop}
              onOpenService={onOpenService}
              onRemove={onRemoveBus}
              trackHref={trackHref}
              onTrack={onTrack}
            />
          ))}
        </ul>
      )}
    </article>
  );
}

interface SavedBusRowProps {
  row: SavedServiceRow;
  stop: BusStop;
  onOpenService: (stop: BusStop, serviceNo: string) => void;
  onRemove: (stopCode: string, serviceNo: string) => void;
  trackHref: (stopCode: string, serviceNo: string) => string;
  onTrack: (stopCode: string, serviceNo: string) => void;
}

function SavedBusRow({ row, stop, onOpenService, onRemove, trackHref, onTrack }: SavedBusRowProps) {
  const { serviceNo, service } = row;

  // Same row as on the board (route line, Track link, three tiles); the star removes the bus.
  if (service) {
    return (
      <ServiceRow
        service={service}
        onOpenService={(no) => onOpenService(stop, no)}
        isSaved
        saveDisabled={false}
        onToggleSave={() => onRemove(stop.busStopCode, serviceNo)}
        trackHref={trackHref(stop.busStopCode, serviceNo)}
        onTrack={() => onTrack(stop.busStopCode, serviceNo)}
      />
    );
  }

  // The stop returned no row for this bus: show empty tiles, not a caption.
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
        <button
          type="button"
          className="icon-btn service-head-end"
          onClick={() => onRemove(stop.busStopCode, serviceNo)}
          aria-label={`Remove bus ${serviceNo} from saved buses`}
        >
          <StarIcon size={16} filled />
        </button>
      </div>
      <div className="eta-grid">
        {[null, null, null].map((timing, index) => (
          <EtaTile key={index} timing={timing} />
        ))}
      </div>
    </li>
  );
}
