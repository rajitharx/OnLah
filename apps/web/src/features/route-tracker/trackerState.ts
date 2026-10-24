import type { RouteTracker } from '../../types/routeTracker';

// Last good data stays on screen while a refresh fails. `receivedAt` is the server clock when the data arrived,
// the same clock `isStale` is given, so a wrong device clock cannot make fresh data look stale.
export interface TrackerState {
  data: RouteTracker | null;
  failed: boolean;
  notFound: boolean;
  receivedAt: number | null;
}

export type TrackerResult = { ok: true; value: RouteTracker } | { ok: false; notFound: boolean };

export const EMPTY_TRACKER: TrackerState = { data: null, failed: false, notFound: false, receivedAt: null };

export const STALE_AFTER_MS = 60_000;

export function applyTrackerResult(previous: TrackerState, result: TrackerResult, receivedAt: number): TrackerState {
  if (result.ok) return { data: result.value, failed: false, notFound: false, receivedAt };
  if (result.notFound) return { data: null, failed: false, notFound: true, receivedAt: null };
  return { ...previous, failed: true };
}

export function isStale(state: TrackerState, now: number): boolean {
  if (state.data === null || state.receivedAt === null) return false;
  return state.failed || now - state.receivedAt > STALE_AFTER_MS;
}
