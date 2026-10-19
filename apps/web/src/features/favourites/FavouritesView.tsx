import type { BusStop } from '../../types/domain';
import { EmptyState } from '../../shared/components/EmptyState';
import { FindStopActions } from '../../shared/components/FindStopActions';
import { StarIcon } from '../../shared/components/Icons';
import { StopCard } from '../../shared/components/StopCard';
import { isNearLimit } from '../../shared/utils/limits';
import { MAX_FAVOURITES } from './favouritesStore';

interface FavouritesViewProps {
  stops: BusStop[];
  onOpen: (stop: BusStop) => void;
  onRemove: (stopCode: string) => void;
  onNavigate: (view: 'search' | 'nearby') => void;
}

export function FavouritesView({ stops, onOpen, onRemove, onNavigate }: FavouritesViewProps) {
  return (
    <section className="saved-stops" aria-labelledby="saved-stops-title">
      <h2 id="saved-stops-title" className="label">Saved stops</h2>
      {isNearLimit(stops.length, MAX_FAVOURITES) && (
        <p className="caption">{stops.length} of {MAX_FAVOURITES} stops saved on this device</p>
      )}

      {stops.length === 0 ? (
        <EmptyState
          icon={<StarIcon size={24} />}
          message="No saved stops yet. Open a stop and tap Save stop."
          action={<FindStopActions onNavigate={onNavigate} />}
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
