// What the header dot shows. 'checking' is the neutral state before the first answer.
export type ApiStatus = 'checking' | 'good' | 'slow' | 'down';

export interface ProbeResult {
  ok: boolean;
  ms: number;
}

// An answer slower than this is amber: the API is up, but a board will feel sluggish.
export const SLOW_MS = 1500;

export function classifyProbe({ ok, ms }: ProbeResult): ApiStatus {
  if (!ok) return 'down';
  return ms > SLOW_MS ? 'slow' : 'good';
}

export const API_STATUS_LABEL: Record<ApiStatus, string> = {
  checking: 'Checking live data',
  good: 'Live data is online',
  slow: 'Live data is slow',
  down: 'Live data is offline',
};

export function betaLabel(version: string): string {
  return `Beta ${version}`;
}
