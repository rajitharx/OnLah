import { useState } from 'react';
import type { BusStop } from '../types/domain';
import { DisruptionBanner } from '../features/disruptions/DisruptionBanner';
import { useTrainAlerts } from '../features/disruptions/useTrainAlerts';
import { FavouritesView } from '../features/favourites/FavouritesView';
import { useFavourites } from '../features/favourites/useFavourites';
import { NearbyView } from '../features/nearby/NearbyView';
import { SearchView } from '../features/search/SearchView';
import { StopBoard } from '../features/arrivals/StopBoard';
import { useStopArrivals } from '../features/arrivals/useStopArrivals';
import { EmptyState } from '../shared/components/EmptyState';
import { SearchIcon } from '../shared/components/Icons';
import { useNow } from '../shared/hooks/useNow';
import { TabBar, type View } from './TabBar';

export default function App() {
  const favourites = useFavourites();
  const [view, setView] = useState<View>('board');
  const [stop, setStop] = useState<BusStop | null>(() => favourites.stops[0] ?? null);
  const now = useNow();
  const alerts = useTrainAlerts();
  const arrivals = useStopArrivals(stop);

  const openStop = (next: BusStop): void => {
    setStop(next);
    setView('board');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="wordmark">
          OnLah
          <span className="wordmark-sub">Bus board</span>
        </div>
      </header>

      <DisruptionBanner alerts={alerts} now={now} />

      <TabBar view={view} onChange={setView} />

      <main className="app-main">
        {view === 'board' && stop === null && (
          <EmptyState
            icon={<SearchIcon size={24} />}
            message="Search for a stop, or open Nearby, to see its bus times."
          />
        )}
        {view === 'board' && stop !== null && (
          <StopBoard
            stop={stop}
            arrivals={arrivals}
            now={now}
            isFavourite={favourites.has(stop.busStopCode)}
            favouritesFull={favourites.isFull}
            onToggleFavourite={() => favourites.toggle(stop)}
          />
        )}
        {view === 'search' && <SearchView onOpen={openStop} />}
        {view === 'nearby' && <NearbyView onOpen={openStop} />}
        {view === 'favourites' && (
          <FavouritesView
            stops={favourites.stops}
            onOpen={openStop}
            onRemove={favourites.remove}
          />
        )}
      </main>

      <footer className="footnote">Live times from LTA DataMall, refreshed every 20 seconds.</footer>
    </div>
  );
}
