import type { BusArrivalsResponse } from '../../types/domain';

// Last known good data stays on screen while a refresh fails.
// `slow` marks a first load still waiting after the cold-start threshold, so the board can explain the wait.
export interface ArrivalsState {
  data: BusArrivalsResponse | null;
  failed: boolean;
  slow: boolean;
}

export type ArrivalsResult = { ok: true; value: BusArrivalsResponse } | { ok: false };

// The free-tier backend sleeps when idle, so a first call can take well over a few seconds.
export const SLOW_LOAD_MS = 3_000;

export const EMPTY_ARRIVALS: ArrivalsState = { data: null, failed: false, slow: false };

export function applyArrivalsResult(previous: ArrivalsState, result: ArrivalsResult): ArrivalsState {
  if (result.ok) return { data: result.value, failed: false, slow: false };
  return { data: previous.data, failed: true, slow: previous.slow };
}

export function markSlowLoad(previous: ArrivalsState): ArrivalsState {
  if (previous.data) return previous;
  return { ...previous, slow: true };
}

// Stores one stop's result beside the others. Used by the first load, the refresh timer, and a manual re-sync.
export function setStopState(
  states: Record<string, ArrivalsState>,
  stopCode: string,
  result: ArrivalsResult,
): Record<string, ArrivalsState> {
  return { ...states, [stopCode]: applyArrivalsResult(states[stopCode] ?? EMPTY_ARRIVALS, result) };
}
