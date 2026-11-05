import { ArrivalTiming, BusArrival, CrowdLevel } from '../../types/domain';
import { computeEtaMinutes } from './eta';

const CROWD_SPOKEN: Record<CrowdLevel, string> = {
  0: 'seats available',
  1: 'standing room only',
  2: 'limited standing',
};

function spokenMinutes(timing: ArrivalTiming, now: number): string {
  const mins = computeEtaMinutes(timing.estimatedArrival, now);
  if (mins < 1) return 'arriving now';
  return mins === 1 ? '1 minute' : `${mins} minutes`;
}

export function buildArrivalLabel(arrival: BusArrival, now: number = Date.now()): string {
  const { nextBus, nextBus2 } = arrival;
  const parts = [`Bus ${arrival.serviceNo}`];

  if (!nextBus) {
    parts.push('no service');
    return parts.join(', ');
  }

  parts.push(spokenMinutes(nextBus, now), CROWD_SPOKEN[nextBus.load]);
  if (nextBus.isWheelchairAccessible) parts.push('wheelchair accessible');
  if (!nextBus.isMonitored) parts.push('scheduled time, not live');
  if (nextBus2) parts.push(`then ${spokenMinutes(nextBus2, now)}`);

  return parts.join(', ');
}

export function buildFavouriteLabel(isFavourite: boolean): string {
  return isFavourite ? 'Remove stop from favourites' : 'Add stop to favourites';
}
