import type { ArrivalTiming } from '../../types/domain';
import { busTypeLabel } from '../../shared/utils/busType';
import { getCrowdLabel } from '../../shared/utils/crowdLevel';
import { formatEta } from '../../shared/utils/eta';

export interface TileLabel {
  value: string;
  unit: 'min' | null;
}

// "Arr" under a minute, otherwise the whole minutes with a unit.
export function tileLabel(timing: ArrivalTiming, now: number): TileLabel {
  const value = formatEta(timing.estimatedArrival, now);
  return { value, unit: value === 'Arr' ? null : 'min' };
}

export function tileSpokenLabel(timing: ArrivalTiming | null, now: number): string {
  if (timing === null) return 'No bus due';
  const value = formatEta(timing.estimatedArrival, now);
  const time = value === 'Arr' ? 'Arriving' : `${value} ${value === '1' ? 'minute' : 'minutes'}`;
  const access = timing.isWheelchairAccessible ? 'wheelchair accessible' : 'not wheelchair accessible';
  const parts = [time, getCrowdLabel(timing.load), busTypeLabel(timing.type), access];
  if (timing.isLastBus) parts.push('last bus');
  return parts.join(', ');
}
