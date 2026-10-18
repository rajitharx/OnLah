import { useState } from 'react';
import type { BusStop } from '../../types/domain';
import { ServiceSheet } from '../services/ServiceSheet';
import { Freshness } from '../../shared/components/Freshness';
import { PinIcon, StarIcon } from '../../shared/components/Icons';
import { MAX_FAVOURITES } from '../favourites/favouritesStore';
import type { ArrivalsState } from './arrivalsState';
import { ServiceRow } from './ServiceRow';
import { busAdvisories } from './busAdvisories';

interface StopBoardProps {
  stop: BusStop;
  arrivals: ArrivalsState;
  now: number;
  isFavourite: boolean;
  favouritesFull: boolean;
  onToggleFavourite: () => void;
}

export function StopBoard({ stop, arrivals, now, isFavourite, favouritesFull, onToggleFavourite }: StopBoardProps) {
  const saveDisabled = !isFavourite && favouritesFull;
  const { data, failed } = arrivals;
  const [openService, setOpenService] = useState<string | null>(null);

  return (
    <section className="board" aria-labelledby="stop-name">
      <header className="board-head">
        <div className="board-title">
          <span className="stop-code">{stop.busStopCode}</span>
          <h1 id="stop-name" className="stop-name">{stop.description}</h1>
          <p className="stop-road">
            <PinIcon size={14} />
            {stop.roadName}
          </p>
        </div>
        <button
          type="button"
          className="btn"
          aria-pressed={isFavourite}
          disabled={saveDisabled}
          onClick={onToggleFavourite}
        >
          <StarIcon size={14} filled={isFavourite} />
          {isFavourite ? 'Saved' : 'Save'}
        </button>
      </header>

      <div className="board-meta">
        {data && <Freshness fetchedAt={data.fetchedAt} now={now} />}
        {saveDisabled && <span className="caption">Favourites are full ({MAX_FAVOURITES})</span>}
      </div>

      {failed && (
        <p className="error" role="alert">
          {data
            ? 'Refresh failed. Showing the last known times.'
            : 'Bus times are unavailable right now. Retrying every 20 seconds.'}
        </p>
      )}
      {!data && !failed && <p className="caption">Loading bus times…</p>}

      {data && busAdvisories(data).map((advisory) => (
        <p className="advisory" role="status" key={advisory.kind === 'service-no-buses' ? advisory.serviceNo : advisory.kind}>
          {advisory.message}
        </p>
      ))}

      {data && data.services.length > 0 && (
        <>
          <p className="label">Next departures · minutes</p>
          <ul className="service-list" aria-label="Bus services">
            {data.services.map((service) => (
              <ServiceRow key={service.serviceNo} service={service} now={now} onOpenService={setOpenService} />
            ))}
          </ul>
        </>
      )}
      {openService !== null && (
        <ServiceSheet serviceNo={openService} arrivals={data} onClose={() => setOpenService(null)} />
      )}
    </section>
  );
}
