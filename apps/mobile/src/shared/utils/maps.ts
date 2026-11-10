// A link that opens the stop's coordinates in the phone's map app, so people can walk to it.
export function mapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
