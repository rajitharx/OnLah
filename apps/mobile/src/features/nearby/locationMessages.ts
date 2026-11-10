export type LocationFailure = 'denied' | 'unavailable' | 'timeout';

const MESSAGES: Record<LocationFailure, string> = {
  denied: 'Location is blocked for OnLah. Allow it in Settings, or search for a stop instead.',
  unavailable: 'Your location is unavailable right now. Try again, or search for a stop instead.',
  timeout: 'Finding your location took too long. Try again, or search for a stop instead.',
};

export function locationFailureMessage(failure: LocationFailure): string {
  return MESSAGES[failure];
}
