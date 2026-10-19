// Browser geolocation error codes: 1 is denied, 2 is unavailable, 3 is a timeout.
const MESSAGES: Record<number, string> = {
  1: 'Location is blocked for this site. Allow it in your browser settings, or search for a stop instead.',
  2: 'Your location is unavailable right now. Try again, or search for a stop instead.',
  3: 'Finding your location took too long. Try again, or search for a stop instead.',
};

export function locationErrorMessage(code: number): string {
  return MESSAGES[code] ?? MESSAGES[2];
}
