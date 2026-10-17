import { useState } from 'react';
import { DisruptionBanner } from '../features/disruptions/DisruptionBanner';
import { FavouritesView } from '../features/favourites/FavouritesView';
import { NearbyView } from '../features/nearby/NearbyView';
import { SearchView } from '../features/search/SearchView';
import { StopBoard } from '../features/arrivals/StopBoard';
import { TabBar, type View } from './TabBar';
import { useFavourites } from '../features/favourites/useFavourites';
import { useNow } from '../shared/hooks/useNow';
import { useStopArrivals } from '../features/arrivals/useStopArrivals';
import { SAMPLE_NOTE, SEED_FAVOURITES, makeSampleTrainAlerts, sampleStops } from '../shared/services/sampleData';

export default function App() {
  const [view, setView] = useState<View>('board');
  const [stopCode, setStopCode] = useState<string>(SEED_FAVOURITES[0]);
  const [trainAlerts] = useState(() => makeSampleTrainAlerts(Date.now()));
  const now = useNow();
  const favourites = useFavourites();
  const arrivals = useStopArrivals(stopCode);
  const stop = sampleStops.find((s) => s.busStopCode === stopCode) ?? sampleStops[0];

  const openStop = (code: string): void => {
    setStopCode(code);
    setView('board');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="wordmark">
          OnLah
          <span className="wordmark-sub">Bus board · design sample</span>
        </div>
      </header>

      <DisruptionBanner alerts={trainAlerts} now={now} />

      <TabBar view={view} onChange={setView} />

      <main className="app-main">
        {view === 'board' && (
          <StopBoard
            stop={stop}
            arrivals={arrivals}
            now={now}
            isFavourite={favourites.has(stop.busStopCode)}
            favouritesFull={favourites.isFull}
            onToggleFavourite={() => favourites.toggle(stop.busStopCode)}
          />
        )}
        {view === 'search' && <SearchView onOpen={openStop} />}
        {view === 'nearby' && <NearbyView onOpen={openStop} />}
        {view === 'favourites' && (
          <FavouritesView codes={favourites.codes} onOpen={openStop} onRemove={favourites.remove} />
        )}
      </main>

      <footer className="footnote">{SAMPLE_NOTE}</footer>
    </div>
  );
}
