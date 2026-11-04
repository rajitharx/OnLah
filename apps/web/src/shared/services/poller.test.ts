// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startPoller, type Poller } from './poller';

let finishes: (() => void)[];
let load: ReturnType<typeof vi.fn<() => Promise<void>>>;
let poller: Poller | undefined;

function setHidden(hidden: boolean): void {
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(hidden);
  document.dispatchEvent(new Event('visibilitychange'));
}

async function finishAll(): Promise<void> {
  finishes.splice(0).forEach((finish) => finish());
  await vi.advanceTimersByTimeAsync(0);
}

beforeEach(() => {
  vi.useFakeTimers();
  finishes = [];
  load = vi.fn(() => new Promise<void>((resolve) => finishes.push(resolve)));
});

afterEach(() => {
  poller?.stop();
  poller = undefined;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('startPoller', () => {
  it('loads at once and again every interval', async () => {
    poller = startPoller(load, 1000);
    expect(load).toHaveBeenCalledTimes(1);

    await finishAll();
    vi.advanceTimersByTime(1000);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('starts no load while one is running, from the timer or poll()', async () => {
    poller = startPoller(load, 1000);
    vi.advanceTimersByTime(3000);
    poller.poll();
    expect(load).toHaveBeenCalledTimes(1);

    await finishAll();
    poller.poll();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('pauses while hidden and loads as soon as the tab is visible again', async () => {
    poller = startPoller(load, 1000);
    await finishAll();
    setHidden(true);
    vi.advanceTimersByTime(10_000);
    expect(load).toHaveBeenCalledTimes(1);

    setHidden(false);
    expect(load).toHaveBeenCalledTimes(2);
    await finishAll();
    vi.advanceTimersByTime(1000);
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('does not start the timer when it starts in a hidden tab', async () => {
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    poller = startPoller(load, 1000);
    await finishAll();
    vi.advanceTimersByTime(10_000);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('stops the timer and the visibility listener, but poll() still loads', async () => {
    poller = startPoller(load, 1000);
    await finishAll();
    poller.stop();
    vi.advanceTimersByTime(10_000);
    setHidden(false);
    expect(load).toHaveBeenCalledTimes(1);

    poller.poll();
    expect(load).toHaveBeenCalledTimes(2);
  });
});
