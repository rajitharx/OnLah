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
import { useBoardStop, type BoardStopStatus } from '../features/arrivals/useBoardStop';
import { useStopArrivals } from '../features/arrivals/useStopArrivals';
import { EmptyState } from '../shared/components/EmptyState';
import { SearchIcon } from '../shared/components/Icons';
import { useNow } from '../shared/hooks/useNow';
import { TabBar } from './TabBar';
import { cameFromInApp, useRoute } from './useRoute';
import { defaultView, type TabView } from './routes';

const BOARD_MESSAGES: Record<Exclude<BoardStopStatus, 'idle' | 'ready'>, string> = {
  loading: 'Loading stop…',
  'not-found': 'That stop was not found.',
  failed: 'The stop is unavailable right now. Try again.',
};

export default function App() {
  const favourites = useFavourites();
  const savedBuses = useSavedBuses();
  const { route, push, replace } = useRoute();
  const [searchQuery, setSearchQuery] = useState('');
  const [knownStop, setKnownStop] = useState<BusStop | null>(null);
  const now = useNow();
  const alerts = useTrainAlerts();

  const board = useBoardStop(route.view === 'board' ? route.stopCode : null, knownStop);
  const arrivals = useStopArrivals(board.stop);
  const savedArrivals = useSavedArrivals(groupByStop(savedBuses.buses).map((group) => group.stopCode));

  const hasSaved = savedBuses.buses.length > 0 || favourites.stops.length > 0;
  const view: TabView | 'board' = route.view === 'home' ? defaultView(hasSaved) : route.view;

  const openStop = (next: BusStop): void => {
    setKnownStop(next);
    push({ view: 'board', stopCode: next.busStopCode, serviceNo: null });
  };

  const goBack = (): void => {
    if (cameFromInApp()) window.history.back();
    else push({ view: defaultView(hasSaved) });
  };

  const toggleBus = (serviceNo: string): void => {
    if (board.stop === null) return;
    savedBuses.toggle({
      stopCode: board.stop.busStopCode,
      serviceNo,
      stopName: board.stop.description,
      roadName: board.stop.roadName,
      latitude: board.stop.latitude,
      longitude: board.stop.longitude,
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

      <TabBar view={view} onChange={(next) => push({ view: next })} />

      <main className="app-main">
        {route.view === 'board' && board.stop !== null && (
          <StopBoard
            stop={board.stop}
            arrivals={arrivals}
            now={now}
            isFavourite={favourites.has(board.stop.busStopCode)}
            favouritesFull={favourites.isFull}
            onToggleFavourite={() => favourites.toggle(board.stop!)}
            isBusSaved={(serviceNo) => savedBuses.has(board.stop!.busStopCode, serviceNo)}
            savedBusesFull={savedBuses.isFull}
            onToggleBus={toggleBus}
            openService={route.serviceNo}
            onOpenService={(serviceNo) => push({ view: 'board', stopCode: route.stopCode, serviceNo })}
            onCloseService={() => replace({ view: 'board', stopCode: route.stopCode, serviceNo: null })}
            onBack={goBack}
          />
        )}
        {route.view === 'board' && board.stop === null && board.status !== 'idle' && board.status !== 'ready' && (
          <EmptyState icon={<SearchIcon size={24} />} message={BOARD_MESSAGES[board.status]} />
        )}
        {view === 'search' && (
          <SearchView query={searchQuery} onQueryChange={setSearchQuery} onOpen={openStop} />
        )}
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
