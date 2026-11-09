export interface Poller {
  // Loads now, unless a load is still running.
  poll(): void;
  // Ends the schedule. poll() still works for a manual retry.
  stop(): void;
}

// Whether the app is in the foreground. The React Native source lives in appVisibility.ts so this file stays pure.
export interface Visibility {
  isActive(): boolean;
  subscribe(onChange: (active: boolean) => void): () => void;
}

// Loads now and every intervalMs while the app is active. A backgrounded app pauses the timer, and coming back
// loads at once and restarts it. A load never starts while the last one is still running, so a slow response
// cannot land after a newer one. `load` must settle without rejecting.
export function startPoller(load: () => Promise<void>, intervalMs: number, visibility: Visibility): Poller {
  let inFlight = false;
  let timer: ReturnType<typeof setInterval> | undefined;

  const poll = (): void => {
    if (inFlight) return;
    inFlight = true;
    void load().finally(() => {
      inFlight = false;
    });
  };
  const stopTimer = (): void => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
  };
  const onChange = (active: boolean): void => {
    stopTimer();
    if (!active) return;
    poll();
    timer = setInterval(poll, intervalMs);
  };

  poll();
  if (visibility.isActive()) timer = setInterval(poll, intervalMs);
  const unsubscribe = visibility.subscribe(onChange);

  return {
    poll,
    stop() {
      stopTimer();
      unsubscribe();
    },
  };
}
