import { describe, expect, it } from 'vitest';
import type { BusArrivalsResponse } from '../../types/domain';
import { EMPTY_ARRIVALS, applyArrivalsResult } from './arrivalsState';

const first: BusArrivalsResponse = { stopCode: '01012', fetchedAt: '2026-10-17T10:00:00Z', services: [] };
const second: BusArrivalsResponse = { stopCode: '01012', fetchedAt: '2026-10-17T10:00:20Z', services: [] };

describe('applyArrivalsResult', () => {
  it('replaces data and clears the failure flag on success', () => {
    const state = applyArrivalsResult(EMPTY_ARRIVALS, { ok: true, value: first });

    expect(state).toEqual({ data: first, failed: false });
  });

  it('keeps the last known data and marks failure when a refresh fails', () => {
    const state = applyArrivalsResult({ data: first, failed: false }, { ok: false });

    expect(state).toEqual({ data: first, failed: true });
  });

  it('keeps no data when the very first load fails', () => {
    const state = applyArrivalsResult(EMPTY_ARRIVALS, { ok: false });

    expect(state).toEqual({ data: null, failed: true });
  });

  it('clears the failure flag when a later refresh succeeds', () => {
    const failed = applyArrivalsResult({ data: first, failed: false }, { ok: false });

    expect(applyArrivalsResult(failed, { ok: true, value: second })).toEqual({ data: second, failed: false });
  });
});
