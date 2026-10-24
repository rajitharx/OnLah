export interface ServerClock {
  sync(serverTimeIso: string): void;
  now(): number;
}

// Tracks the backend's wall clock. Each response's fetchedAt anchors it, and a monotonic timer carries it forward,
// so a wrong device clock never reaches the ETA maths. Until the first response it falls back to the device clock.
export function createServerClock(
  monotonic: () => number = () => performance.now(),
  wall: () => number = () => Date.now(),
): ServerClock {
  let offset: number | null = null;

  return {
    sync(serverTimeIso) {
      const server = Date.parse(serverTimeIso);
      if (Number.isFinite(server)) offset = server - monotonic();
    },
    now() {
      return offset === null ? wall() : offset + monotonic();
    },
  };
}

export const serverClock = createServerClock();
