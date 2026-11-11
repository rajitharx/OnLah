import type { ArrivalTiming, BusArrival, BusType, HoursRange, OperatingHours, ServiceFrequency } from '../../types/domain';

const NOT_PUBLISHED = 'Not published';

const DECK_LABELS: Record<BusType, string> = { 0: 'single deck', 1: 'double deck', 2: 'bendy' };

export function formatHours(range: HoursRange | null): string {
  return range === null ? NOT_PUBLISHED : `${range.first} to ${range.last}`;
}

// LTA writes ranges with zero padding, such as "09-13". Show them as plain minutes.
export function formatFrequency(value: string | null): string {
  if (value === null) return NOT_PUBLISHED;
  const match = /^(\d{1,2})-(\d{1,2})$/.exec(value);
  return match ? `${Number(match[1])} to ${Number(match[2])} min` : value;
}

// The static LTA data has no deck type, so this summarises what the live arrivals show now.
export function summarizeDeckTypes(types: BusType[]): string {
  const unique = [...new Set(types)].sort((a, b) => a - b).map((type) => DECK_LABELS[type]);
  if (unique.length === 0) return 'No deck type seen right now';

  const text =
    unique.length === 1
      ? unique[0]
      : `${unique.slice(0, -1).join(', ')} and ${unique[unique.length - 1]}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function collectDeckTypes(service: BusArrival | null): BusType[] {
  if (service === null) return [];
  const timings: (ArrivalTiming | null)[] = [service.nextBus, service.nextBus2, service.nextBus3];
  const types = timings.flatMap((timing) => (timing === null ? [] : [timing.type]));
  return [...new Set(types)].sort((a, b) => a - b) as BusType[];
}

export interface DetailRow {
  label: string;
  value: string;
}

// Only the days LTA publishes. A missing day is left out rather than shown as "Not published".
export function hoursRows(hours: OperatingHours): DetailRow[] {
  const days: [string, HoursRange | null][] = [
    ['Weekday', hours.weekday],
    ['Saturday', hours.saturday],
    ['Sunday', hours.sunday],
  ];
  return days.flatMap(([label, range]) => (range === null ? [] : [{ label, value: formatHours(range) }]));
}

// The same rule for the peak and off-peak minutes. Missing values are left out.
export function frequencyRows(frequency: ServiceFrequency): DetailRow[] {
  const periods: [string, string | null][] = [
    ['Morning peak', frequency.amPeak],
    ['Morning off-peak', frequency.amOffPeak],
    ['Evening peak', frequency.pmPeak],
    ['Evening off-peak', frequency.pmOffPeak],
  ];
  return periods.flatMap(([label, value]) => (value === null ? [] : [{ label, value: formatFrequency(value) }]));
}
