import type { BusStop } from '../../types/domain';
import { EmptyState } from '../../shared/components/EmptyState';
import { StarIcon } from '../../shared/components/Icons';
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
}

// The landing tab: saved buses first, then saved stops.
export function SavedView({ buses, arrivals, now, stops, onOpenStop, onRemoveBus, onRemoveStop }: SavedViewProps) {
  const groups = groupByStop(buses);

  return (
    <section className="view" aria-labelledby="saved-title">
      <h1 id="saved-title" className="view-title">Saved</h1>
      <p className="caption">{buses.length} of {MAX_SAVED_BUSES} buses saved on this device</p>

      {groups.length === 0 ? (
        <EmptyState
          icon={<StarIcon size={24} />}
          message="No saved buses yet. Open a stop and tap the star next to a bus."
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
          />
        ))
      )}

      <FavouritesView stops={stops} onOpen={onOpenStop} onRemove={onRemoveStop} />
    </section>
  );
}
