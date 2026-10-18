import { useState } from 'react';
import type { BusStop } from '../types/domain';
import { DisruptionBanner } from '../features/disruptions/DisruptionBanner';
import { useTrainAlerts } from '../features/disruptions/useTrainAlerts';
import { useFavourites } from '../features/favourites/useFavourites';
import { SavedView } from '../features/saved-buses/SavedView';
import { groupByStop } from '../features/saved-buses/savedBusView';
import { useSavedArrivals } from '../features/saved-buses/useSavedArrivals';
import { useSavedBuses } from '../features/saved-buses/useSavedBuses';
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
  const savedBuses = useSavedBuses();
  const [view, setView] = useState<View>('saved');
  const [stop, setStop] = useState<BusStop | null>(() => favourites.stops[0] ?? null);
  const now = useNow();
  const alerts = useTrainAlerts();
  const arrivals = useStopArrivals(stop);
  const savedArrivals = useSavedArrivals(groupByStop(savedBuses.buses).map((group) => group.stopCode));

  const openStop = (next: BusStop): void => {
    setStop(next);
    setView('board');
  };

  const toggleBus = (serviceNo: string): void => {
    if (stop === null) return;
    savedBuses.toggle({
      stopCode: stop.busStopCode,
      serviceNo,
      stopName: stop.description,
      roadName: stop.roadName,
      latitude: stop.latitude,
      longitude: stop.longitude,
    });
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
            isBusSaved={(serviceNo) => savedBuses.has(stop.busStopCode, serviceNo)}
            savedBusesFull={savedBuses.isFull}
            onToggleBus={toggleBus}
          />
        )}
        {view === 'search' && <SearchView onOpen={openStop} />}
        {view === 'nearby' && <NearbyView onOpen={openStop} />}
        {view === 'saved' && (
          <SavedView
            buses={savedBuses.buses}
            arrivals={savedArrivals}
            now={now}
            stops={favourites.stops}
            onOpenStop={openStop}
            onRemoveBus={savedBuses.remove}
            onRemoveStop={favourites.remove}
          />
        )}
      </main>

      <footer className="footnote">Live times from LTA DataMall, refreshed every 20 seconds.</footer>
    </div>
  );
}
