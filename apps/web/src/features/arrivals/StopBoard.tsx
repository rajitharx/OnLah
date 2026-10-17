import type { BusArrivalsResponse, BusStop } from '../../types/domain';
import { Freshness } from '../../shared/components/Freshness';
import { PinIcon, StarIcon } from '../../shared/components/Icons';
import { ServiceRow } from './ServiceRow';

interface StopBoardProps {
  stop: BusStop;
  arrivals: BusArrivalsResponse;
  now: number;
  isFavourite: boolean;
  favouritesFull: boolean;
  onToggleFavourite: () => void;
}

export function StopBoard({ stop, arrivals, now, isFavourite, favouritesFull, onToggleFavourite }: StopBoardProps) {
  const saveDisabled = !isFavourite && favouritesFull;

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
        <Freshness fetchedAt={arrivals.fetchedAt} now={now} />
        {saveDisabled && <span className="caption">Favourites are full (10)</span>}
      </div>

      <p className="label">Next departures</p>
      <ul className="service-list" aria-label="Bus services">
        {arrivals.services.map((service) => (
          <ServiceRow key={service.serviceNo} service={service} now={now} />
        ))}
      </ul>
    </section>
  );
}
