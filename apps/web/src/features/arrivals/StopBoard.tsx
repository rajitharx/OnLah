import type { BusStop } from '../../types/domain';
import { ServiceSheet } from '../services/ServiceSheet';
import { Freshness } from '../../shared/components/Freshness';
import { MapIcon, PinIcon, StarIcon } from '../../shared/components/Icons';
import { ResyncButton } from '../../shared/components/ResyncButton';
import { mapsUrl } from '../../shared/utils/geo';
import { sortByServiceNo } from '../../shared/utils/serviceNo';
import { MAX_FAVOURITES } from '../favourites/favouritesStore';
import type { ArrivalsState } from './arrivalsState';
import { ServiceRow } from './ServiceRow';
import { BoardLegend } from './BoardLegend';
import { busAdvisories } from './busAdvisories';

interface StopBoardProps {
  stop: BusStop;
  arrivals: ArrivalsState;
  now: number;
  isFavourite: boolean;
  favouritesFull: boolean;
  onToggleFavourite: () => void;
  isBusSaved: (serviceNo: string) => boolean;
  savedBusesFull: boolean;
  onToggleBus: (serviceNo: string) => void;
  // The open service lives in the URL, so the back button closes the sheet first.
  openService: string | null;
  onOpenService: (serviceNo: string) => void;
  onCloseService: () => void;
  onBack: () => void;
  onRefresh: () => void;
  trackHref: (serviceNo: string) => string;
  onTrack: (serviceNo: string) => void;
}

export function StopBoard({
  stop,
  arrivals,
  now,
  isFavourite,
  favouritesFull,
  onToggleFavourite,
  isBusSaved,
  savedBusesFull,
  onToggleBus,
  openService,
  onOpenService,
  onCloseService,
  onBack,
  onRefresh,
  trackHref,
  onTrack,
}: StopBoardProps) {
  const saveDisabled = !isFavourite && favouritesFull;
  const { data, failed } = arrivals;

  return (
    <section className="board" aria-labelledby="stop-name">
      <button type="button" className="btn btn-quiet board-back" onClick={onBack}>
        ← Back
      </button>
      <header className="board-head">
        <div className="board-title">
          <span className="stop-code">{stop.busStopCode}</span>
          <h1 id="stop-name" className="stop-name">{stop.description}</h1>
          <p className="stop-road">
            <PinIcon size={14} />
            {stop.roadName}
          </p>
          <a className="map-link" href={mapsUrl(stop.latitude, stop.longitude)} target="_blank" rel="noopener noreferrer">
            <MapIcon size={14} />
            Show in Maps
          </a>
        </div>
        <button
          type="button"
          className="btn"
          aria-pressed={isFavourite}
          disabled={saveDisabled}
          onClick={onToggleFavourite}
        >
          <StarIcon size={14} filled={isFavourite} />
          {isFavourite ? 'Saved stop' : 'Save stop'}
        </button>
      </header>

      <div className="board-meta">
        {data && <Freshness fetchedAt={data.fetchedAt} now={now} stale={failed} />}
        <span className="caption">LTA DataMall · every 20s</span>
        <ResyncButton label="Refresh bus times" onClick={onRefresh} />
        {saveDisabled && <span className="caption">Favourites are full ({MAX_FAVOURITES})</span>}
      </div>

      {failed && (
        <p className="error" role="alert">
          {data
            ? 'Refresh failed. Showing the last known times.'
            : 'Bus times are unavailable right now. Retrying every 20 seconds.'}
        </p>
      )}
      {!data && !failed && (
        <p className="caption" role="status">
          {arrivals.slow ? 'Waking up the server… the first load can take up to a minute.' : 'Loading bus times…'}
        </p>
      )}

      {data && busAdvisories(data).map((advisory) => (
        <p className="advisory" role="status" key={advisory.kind === 'service-no-buses' ? advisory.serviceNo : advisory.kind}>
          {advisory.message}
        </p>
      ))}

      {data && data.services.length > 0 && (
        <>
          <p className="label">Next departures · minutes</p>
          <BoardLegend />
          <ul className="service-list" aria-label="Bus services">
            {sortByServiceNo(data.services).map((service) => (
              <ServiceRow
                key={service.serviceNo}
                service={service}
                now={now}
                onOpenService={onOpenService}
                isSaved={isBusSaved(service.serviceNo)}
                saveDisabled={!isBusSaved(service.serviceNo) && savedBusesFull}
                onToggleSave={() => onToggleBus(service.serviceNo)}
                trackHref={trackHref(service.serviceNo)}
                onTrack={() => onTrack(service.serviceNo)}
              />
            ))}
          </ul>
        </>
      )}
      {openService !== null && (
        <ServiceSheet serviceNo={openService} arrivals={data} onClose={onCloseService} />
      )}
    </section>
  );
}
