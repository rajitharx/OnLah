import type { BusType, CrowdLevel } from '../../types/domain';
import type { TrackedBus, TrackerStatus } from '../../types/routeTracker';

// "Arr" means under a minute, whatever the stop count says. A null count gives no number, so none can be wrong.
export function stopsAwayLabel(stopsAway: number | null, etaLabel: string): string | null {
  if (stopsAway === 0 || etaLabel === 'Arr') return 'Arriving';
  if (stopsAway === null) return null;
  return stopsAway === 1 ? '1 stop away' : `${stopsAway} stops away`;
}

export interface StatusMessage {
  title: string;
  detail: string;
}

const STATUS_MESSAGES: Record<TrackerStatus, StatusMessage | null> = {
  live: null,
  scheduled: { title: 'Scheduled', detail: 'These times come from the timetable. The bus is not tracked live.' },
  noEstimate: { title: 'No Est. Available', detail: 'The service should be running, but LTA has no estimate right now.' },
  notInOperation: { title: 'Not In Operation', detail: 'No buses are running on this service at this time.' },
};

export function statusMessage(status: TrackerStatus): StatusMessage | null {
  return STATUS_MESSAGES[status];
}

const CROWD_LEVELS: Record<TrackedBus['load'], CrowdLevel> = { SEA: 0, SDA: 1, LSD: 2 };
const BUS_TYPES: Record<TrackedBus['type'], BusType> = { SD: 0, DD: 1, BD: 2 };

export function crowdLevelOf(load: TrackedBus['load']): CrowdLevel {
  return CROWD_LEVELS[load];
}

export function deckTypeOf(type: TrackedBus['type']): BusType {
  return BUS_TYPES[type];
}
