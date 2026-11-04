export interface Poller {
  // Loads now, unless a load is still running.
  poll(): void;
  // Ends the schedule. poll() still works for a manual retry.
  stop(): void;
}

// Loads now and every intervalMs while the tab is visible. A hidden tab pauses the timer, and the tab coming back
// loads at once and restarts it. A load never starts while the last one is still running, so a slow response
// cannot land after a newer one. `load` must settle without rejecting.
export function startPoller(load: () => Promise<void>, intervalMs: number): Poller {
  let inFlight = false;
  let timer: number | undefined;

  const poll = (): void => {
    if (inFlight) return;
    inFlight = true;
    void load().finally(() => {
      inFlight = false;
    });
  };
  const stopTimer = (): void => {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
  };
  const onVisibility = (): void => {
    stopTimer();
    if (document.hidden) return;
    poll();
    timer = window.setInterval(poll, intervalMs);
  };

  poll();
  if (!document.hidden) timer = window.setInterval(poll, intervalMs);
  document.addEventListener('visibilitychange', onVisibility);

  return {
    poll,
    stop() {
      stopTimer();
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
