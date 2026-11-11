import { startPoller, type Poller, type Visibility } from '../../shared/services/poller';

export interface StopPollers {
  size: number;
  // Loads one stop now, for its Re-sync button. The timer keeps its own schedule.
  resync: (stopCode: string) => void;
  stopAll: () => void;
}

// One poller per stop, so each stop keeps its own request in flight and its own last good data.
export function startStopPollers(
  stopCodes: string[],
  load: (stopCode: string) => Promise<void>,
  intervalMs: number,
  visibility: Visibility,
): StopPollers {
  const pollers = new Map<string, Poller>();
  for (const code of stopCodes) {
    if (!pollers.has(code)) pollers.set(code, startPoller(() => load(code), intervalMs, visibility));
  }
  return {
    size: pollers.size,
    resync: (stopCode) => pollers.get(stopCode)?.poll(),
    stopAll: () => pollers.forEach((poller) => poller.stop()),
  };
}
