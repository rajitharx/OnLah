import type { BusArrival, BusArrivalsResponse } from '../../types/domain';

// Advisories are derived from the arrivals response, not from a separate LTA feed.
// LTA publishes no bus disruption feed in our references, so these describe missing data, not a cause.
export type BusAdvisory =
  | { kind: 'stop-quiet'; message: string }
  | { kind: 'service-no-buses'; serviceNo: string; message: string };

const STOP_QUIET_MESSAGE =
  'No bus times for this stop right now. Buses may not be running, or the data is unavailable.';

function hasNoBusesDue(service: BusArrival): boolean {
  return service.nextBus === null && service.nextBus2 === null && service.nextBus3 === null;
}

export function busAdvisories(arrivals: BusArrivalsResponse): BusAdvisory[] {
  if (arrivals.services.length === 0) {
    return [{ kind: 'stop-quiet', message: STOP_QUIET_MESSAGE }];
  }

  return arrivals.services.filter(hasNoBusesDue).map((service) => ({
    kind: 'service-no-buses',
    serviceNo: service.serviceNo,
    message: `Service ${service.serviceNo} has no buses due.`,
  }));
}
