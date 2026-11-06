export function computeEtaMinutes(estimatedArrival: string): number {
  return Math.floor((new Date(estimatedArrival).getTime() - Date.now()) / 60_000);
}

export function formatEta(estimatedArrival: string): string {
  const mins = computeEtaMinutes(estimatedArrival);
  if (mins < 1) return 'Arr';
  return String(mins);
}

// The later buses after the first, such as "then 8 · 15 min" or "then Arr". Empty when there are none.
export function formatThen(laterBuses: (string | null)[]): string {
  const parts = laterBuses.filter((eta): eta is string => eta !== null).map(formatEta);
  if (parts.length === 0) return '';
  const last = parts[parts.length - 1];
  return `then ${parts.join(' · ')}${last === 'Arr' ? '' : ' min'}`;
}

export function formatFreshness(fetchedAt: string): string {
  const secs = Math.floor((Date.now() - new Date(fetchedAt).getTime()) / 1000);
  if (secs < 60) return `Updated ${secs}s ago`;
  return `Updated ${Math.floor(secs / 60)}m ago`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
