import { EmptyState } from '../../shared/components/EmptyState';
import { SearchIcon } from '../../shared/components/Icons';
import { StaleNotice } from '../../shared/components/StaleNotice';
import { Countdown, EmptyCountdown } from './Countdown';
import { NextBusStrip } from './NextBusStrip';
import { Rail } from './Rail';
import { TrackerHeader } from './TrackerHeader';
import { buildRail } from './railModel';
import type { TrackerState } from './trackerState';

interface TrackerContentProps {
  state: TrackerState;
  stopCode: string;
  serviceNo: string;
  now: number;
  stale: boolean;
  onRetry: () => void;
}

export function TrackerContent({ state, stopCode, serviceNo, now, stale, onRetry }: TrackerContentProps) {
  const { data } = state;

  if (state.notFound) {
    return (
      <EmptyState
        icon={<SearchIcon size={24} />}
        message={`Bus ${serviceNo} at stop ${stopCode} was not found.`}
      />
    );
  }

  if (data === null) {
    return state.failed ? <LoadError onRetry={onRetry} /> : <Skeleton />;
  }

  const [next, ...later] = data.buses;
  const rail = buildRail(data.stops, data.userStopIndex, next?.nearestStopCode ?? null, next?.load ?? null);

  return (
    <div className="tracker-body">
      <TrackerHeader tracker={data} now={now} stale={stale} />
      {state.failed && <StaleNotice fetchedAt={data.fetchedAt} now={now} onRetry={onRetry} />}
      {next === undefined ? <EmptyCountdown status={data.status} /> : <Countdown bus={next} />}
      <NextBusStrip buses={later} />
      <Rail nodes={rail} />
    </div>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="tracker-error">
      <p className="error" role="alert">The route tracker is unavailable right now.</p>
      <button type="button" className="btn" onClick={onRetry}>Try again</button>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="tracker-skeleton" aria-busy="true" aria-label="Loading the route">
      <span className="skeleton-block skeleton-head" />
      <span className="skeleton-block skeleton-hero" />
      <span className="skeleton-block skeleton-row" />
      <span className="skeleton-block skeleton-row" />
      <span className="skeleton-block skeleton-row" />
    </div>
  );
}
