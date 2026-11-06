export const STALE_AFTER_MS = 40_000;

export function computeEtaMinutes(estimatedArrival: string, now: number): number {
  return Math.floor((Date.parse(estimatedArrival) - now) / 60_000);
}

export function formatEta(estimatedArrival: string, now: number): string {
  const mins = computeEtaMinutes(estimatedArrival, now);
  if (mins < 1) return 'Arr';
  return String(mins);
}

// The later buses after the first, such as "then 8 · 15 min" or "then Arr". Empty when there are none.
export function formatThen(laterBuses: (string | null)[], now: number): string {
  const parts = laterBuses.filter((eta): eta is string => eta !== null).map((eta) => formatEta(eta, now));
  if (parts.length === 0) return '';
  const last = parts[parts.length - 1];
  return `then ${parts.join(' · ')}${last === 'Arr' ? '' : ' min'}`;
}

export function formatFreshness(fetchedAt: string, now: number): string {
  const secs = Math.max(0, Math.floor((now - Date.parse(fetchedAt)) / 1000));
  if (secs < 60) return `Updated ${secs}s ago`;
  return `Updated ${Math.floor(secs / 60)}m ago`;
}

export function isStale(fetchedAt: string, now: number): boolean {
  return now - Date.parse(fetchedAt) > STALE_AFTER_MS;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
