import { useRef, useState } from 'react';
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
import { ReleaseNotesView } from '../features/release-notes/ReleaseNotesView';
import { RouteTrackerView } from '../features/route-tracker/RouteTrackerView';
import { useBoardStop, type BoardStopStatus } from '../features/arrivals/useBoardStop';
import { useStopArrivals } from '../features/arrivals/useStopArrivals';
import { EmptyState } from '../shared/components/EmptyState';
import { SearchIcon } from '../shared/components/Icons';
import { useNow } from '../shared/hooks/useNow';
import { OfflineNotice } from '../shared/components/OfflineNotice';
import { APP_VERSION, betaLabel } from '../shared/version';
import { AppHeader } from './AppHeader';
import { TabBar } from './TabBar';
import { cameFromInApp, useRoute } from './useRoute';
import { useViewAnnouncement } from './useViewAnnouncement';
import { viewKey, viewTitle } from './viewTitle';
import { defaultView, formatRoute, type TabView } from './routes';

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
  const sheetPushedFromBoard = useRef(false);
  const now = useNow();
  const alerts = useTrainAlerts();

  const board = useBoardStop(route.view === 'board' ? route.stopCode : null, knownStop);
  const arrivals = useStopArrivals(board.stop);
  const saved = useSavedArrivals(groupByStop(savedBuses.buses).map((group) => group.stopCode));

  const hasSaved = savedBuses.buses.length > 0 || favourites.stops.length > 0;
  const view: TabView | 'board' | 'track' | 'notes' = route.view === 'home' ? defaultView(hasSaved) : route.view;

  const resolved = route.view === 'home' ? { view: defaultView(hasSaved) } : route;
  useViewAnnouncement(viewKey(resolved), viewTitle(resolved, route.view === 'board' ? board.stop : null));

  const openStop = (next: BusStop): void => {
    setKnownStop(next);
    push({ view: 'board', stopCode: next.busStopCode, serviceNo: null });
  };

  const goBack = (): void => {
    if (cameFromInApp()) window.history.back();
    else push({ view: defaultView(hasSaved) });
  };

  const openService = (next: BusStop, serviceNo: string): void => {
    sheetPushedFromBoard.current = false;
    setKnownStop(next);
    push({ view: 'board', stopCode: next.busStopCode, serviceNo });
  };

  const closeService = (): void => {
    if (route.view !== 'board') return;
    if (sheetPushedFromBoard.current && cameFromInApp()) window.history.back();
    else replace({ view: 'board', stopCode: route.stopCode, serviceNo: null });
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
      <AppHeader version={betaLabel(APP_VERSION)} onHome={() => push({ view: 'home' })} />

      <DisruptionBanner alerts={alerts} now={now} />

      <OfflineNotice />

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
            onOpenService={(serviceNo) => {
              sheetPushedFromBoard.current = true;
              push({ view: 'board', stopCode: route.stopCode, serviceNo });
            }}
            onCloseService={closeService}
            onBack={goBack}
            onRefresh={arrivals.refresh}
            trackHref={(serviceNo) => formatRoute({ view: 'track', stopCode: route.stopCode, serviceNo })}
            onTrack={(serviceNo) => push({ view: 'track', stopCode: route.stopCode, serviceNo })}
          />
        )}
        {route.view === 'track' && (
          <RouteTrackerView stopCode={route.stopCode} serviceNo={route.serviceNo} now={now} onBack={goBack} />
        )}
        {route.view === 'board' && board.stop === null && board.status !== 'idle' && board.status !== 'ready' && (
          <EmptyState icon={<SearchIcon size={24} />} message={BOARD_MESSAGES[board.status]} />
        )}
        {route.view === 'notes' && <ReleaseNotesView version={APP_VERSION} />}
        {view === 'search' && (
          <SearchView query={searchQuery} onQueryChange={setSearchQuery} onOpen={openStop} />
        )}
        {view === 'nearby' && <NearbyView onOpen={openStop} onNavigate={(next) => push({ view: next })} />}
        {view === 'saved' && (
          <SavedView
            buses={savedBuses.buses}
            arrivals={saved.states}
            now={now}
            stops={favourites.stops}
            onOpenStop={openStop}
            onRemoveBus={savedBuses.remove}
            onRemoveStop={favourites.remove}
            onOpenService={openService}
            onResync={saved.resync}
            onNavigate={(next) => push({ view: next })}
          />
        )}
      </main>
    </div>
  );
}
