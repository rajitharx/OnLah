import type { ArrivalRoute, ArrivalTiming, BusArrival } from '../../types/domain';

export interface DirectionGroup {
  routes: ArrivalRoute[];
  timings: (ArrivalTiming | null)[];
}

const SLOTS = 3;

// A stop served in both directions lists every bus of the service together. Each bus names the stop it is heading to,
// so with that name on every bus the board can show each direction on its own. Otherwise it keeps one combined group.
export function groupByDirection(service: BusArrival): DirectionGroup[] {
  const timings = [service.nextBus, service.nextBus2, service.nextBus3];
  const buses = timings.filter((timing): timing is ArrivalTiming => timing !== null);
  const known = new Set(service.routes.map((route) => route.destinationCode));
  const canSplit =
    service.routes.length > 1 && buses.every((bus) => bus.destinationCode != null && known.has(bus.destinationCode));

  if (!canSplit) return [{ routes: service.routes, timings }];

  return service.routes.map((route) => {
    const own: (ArrivalTiming | null)[] = buses.filter((bus) => bus.destinationCode === route.destinationCode);
    while (own.length < SLOTS) own.push(null);
    return { routes: [route], timings: own };
  });
}
