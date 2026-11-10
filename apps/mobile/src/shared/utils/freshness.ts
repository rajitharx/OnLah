import { formatFreshness } from './eta';

export const STALE_TITLE = "Couldn't refresh.";

// A stale chip says so in words, so the state never rests on colour alone.
export function freshnessText(fetchedAt: string, now: number, stale: boolean): string {
  return `${stale ? 'Stale · ' : ''}${formatFreshness(fetchedAt, now)}`;
}

export function staleDetail(fetchedAt: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - Date.parse(fetchedAt)) / 1_000));
  return `Showing data from ${seconds}s ago.`;
}
