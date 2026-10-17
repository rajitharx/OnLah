import type { BusArrivalsResponse } from '../../types/domain';

// Last known good data stays on screen while a refresh fails.
export interface ArrivalsState {
  data: BusArrivalsResponse | null;
  failed: boolean;
}

export type ArrivalsResult = { ok: true; value: BusArrivalsResponse } | { ok: false };

export const EMPTY_ARRIVALS: ArrivalsState = { data: null, failed: false };

export function applyArrivalsResult(previous: ArrivalsState, result: ArrivalsResult): ArrivalsState {
  if (result.ok) return { data: result.value, failed: false };
  return { data: previous.data, failed: true };
}
