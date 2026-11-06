export interface ServerClock {
  sync(serverTimeIso: string): void;
  now(): number;
}

// Tracks the backend's clock as an offset from the device clock, anchored to each response's fetchedAt, so a wrong
// device clock never reaches the ETA maths. The offset rides the wall clock rather than a monotonic timer because a
// monotonic timer stops while the phone sleeps. A response older than the last accepted one is ignored.
export function createServerClock(wall: () => number = () => Date.now()): ServerClock {
  let offset = 0;
  let anchor = -Infinity;

  return {
    sync(serverTimeIso) {
      const server = Date.parse(serverTimeIso);
      if (!Number.isFinite(server) || server < anchor) return;
      anchor = server;
      offset = server - wall();
    },
    now() {
      return wall() + offset;
    },
  };
}

export const serverClock = createServerClock();
