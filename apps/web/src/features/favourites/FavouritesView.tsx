import { sampleStops } from '../../shared/services/sampleData';
import type { BusStop } from '../../types/domain';
import { MAX_FAVOURITES } from './useFavourites';
import { EmptyState } from '../../shared/components/EmptyState';
import { StarIcon } from '../../shared/components/Icons';
import { StopCard } from '../../shared/components/StopCard';

interface FavouritesViewProps {
  codes: string[];
  onOpen: (stopCode: string) => void;
  onRemove: (stopCode: string) => void;
}

export function FavouritesView({ codes, onOpen, onRemove }: FavouritesViewProps) {
  const stops = codes
    .map((code) => sampleStops.find((s) => s.busStopCode === code))
    .filter((s): s is BusStop => s !== undefined);

  return (
    <section className="view" aria-labelledby="favourites-title">
      <h1 id="favourites-title" className="view-title">Saved stops</h1>
      <p className="caption">{codes.length} of {MAX_FAVOURITES} saved on this device</p>

      {stops.length === 0 ? (
        <EmptyState
          icon={<StarIcon size={24} />}
          message="No saved stops yet. Open a stop and tap Save."
        />
      ) : (
        <div className="stop-list">
          {stops.map((stop) => (
            <StopCard
              key={stop.busStopCode}
              stop={stop}
              onOpen={onOpen}
              action={
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onRemove(stop.busStopCode)}
                  aria-label={`Remove ${stop.description} from saved stops`}
                >
                  <StarIcon size={16} filled />
                </button>
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
