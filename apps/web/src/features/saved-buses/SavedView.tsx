import type { BusStop } from '../../types/domain';
import { EmptyState } from '../../shared/components/EmptyState';
import { FindStopActions } from '../../shared/components/FindStopActions';
import { StarIcon } from '../../shared/components/Icons';
import { isNearLimit } from '../../shared/utils/limits';
import { FavouritesView } from '../favourites/FavouritesView';
import type { ArrivalsState } from '../arrivals/arrivalsState';
import { MAX_SAVED_BUSES, type SavedBus } from './savedBusesStore';
import { SavedStopCard } from './SavedStopCard';
import { groupByStop } from './savedBusView';

interface SavedViewProps {
  buses: SavedBus[];
  arrivals: Record<string, ArrivalsState>;
  now: number;
  stops: BusStop[];
  onOpenStop: (stop: BusStop) => void;
  onRemoveBus: (stopCode: string, serviceNo: string) => void;
  onRemoveStop: (stopCode: string) => void;
  onMoveBus: (stopCode: string, serviceNo: string, delta: -1 | 1) => void;
  onMoveStop: (stopCode: string, delta: -1 | 1) => void;
  onNavigate: (view: 'search' | 'nearby') => void;
}

// The landing tab: saved buses first, then saved stops.
export function SavedView({
  buses,
  arrivals,
  now,
  stops,
  onOpenStop,
  onRemoveBus,
  onRemoveStop,
  onMoveBus,
  onMoveStop,
  onNavigate,
}: SavedViewProps) {
  const groups = groupByStop(buses);

  return (
    <section className="view" aria-labelledby="saved-title">
      <h1 id="saved-title" className="view-title">Saved</h1>

      <section className="saved-buses" aria-labelledby="saved-buses-title">
        <h2 id="saved-buses-title" className="label">Saved buses</h2>
        {isNearLimit(buses.length, MAX_SAVED_BUSES) && (
          <p className="caption">{buses.length} of {MAX_SAVED_BUSES} buses saved on this device</p>
        )}

        {groups.length === 0 ? (
          <EmptyState
            icon={<StarIcon size={24} />}
            message="No saved buses yet. Open a stop and tap the star next to a bus."
            action={<FindStopActions onNavigate={onNavigate} />}
          />
        ) : (
          groups.map((group) => (
            <SavedStopCard
              key={group.stopCode}
              group={group}
              state={arrivals[group.stopCode]}
              now={now}
              onOpenStop={onOpenStop}
              onRemoveBus={onRemoveBus}
              onMoveBus={onMoveBus}
            />
          ))
        )}
      </section>

      <FavouritesView
        stops={stops}
        onOpen={onOpenStop}
        onRemove={onRemoveStop}
        onMove={onMoveStop}
        onNavigate={onNavigate}
      />
    </section>
  );
}
