import type { LocationFailure } from '../../features/nearby/locationMessages';

// The slice of expo-location that finding the phone needs, so the rules can be tested without a device.
export interface LocationApi {
  requestPermission(): Promise<'granted' | 'denied'>;
  getPosition(): Promise<{ latitude: number; longitude: number }>;
}

export type LocateResult =
  | { kind: 'ok'; latitude: number; longitude: number }
  | { kind: 'failed'; failure: LocationFailure };

export const LOCATE_TIMEOUT_MS = 10_000;

class LocateTimeout extends Error {}

function failureFor(error: unknown): LocationFailure {
  if (error instanceof LocateTimeout) return 'timeout';
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && code.toUpperCase().includes('TIMEOUT') ? 'timeout' : 'unavailable';
}

// Asks for permission, then for one position. Never throws: every outcome is a result the screen can explain.
export async function locateOnce(api: LocationApi, timeoutMs = LOCATE_TIMEOUT_MS): Promise<LocateResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    if ((await api.requestPermission()) !== 'granted') return { kind: 'failed', failure: 'denied' };
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new LocateTimeout()), timeoutMs);
    });
    const { latitude, longitude } = await Promise.race([api.getPosition(), timeout]);
    return { kind: 'ok', latitude, longitude };
  } catch (error) {
    return { kind: 'failed', failure: failureFor(error) };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
