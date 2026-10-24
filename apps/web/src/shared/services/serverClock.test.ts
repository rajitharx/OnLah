import { describe, expect, it } from 'vitest';
import { createServerClock } from './serverClock';
import { minutesUntil } from '../utils/arrival';

function fakeTimers(wallStart: number) {
  let mono = 1_000;
  let wall = wallStart;
  return {
    monotonic: () => mono,
    wall: () => wall,
    jumpWall(ms: number) {
      wall += ms;
    },
    advance(ms: number) {
      mono += ms;
      wall += ms;
    },
  };
}

const SERVER_NOW = '2026-10-19T10:00:00Z';
const ARRIVAL = '2026-10-19T10:04:00Z';

describe('serverClock', () => {
  it('falls back to the device clock before any response', () => {
    const t = fakeTimers(5_000);
    expect(createServerClock(t.monotonic, t.wall).now()).toBe(5_000);
  });

  it('reads server time at sync regardless of the device clock', () => {
    const t = fakeTimers(Date.parse(SERVER_NOW) + 3_600_000);
    const clock = createServerClock(t.monotonic, t.wall);
    clock.sync(SERVER_NOW);
    expect(clock.now()).toBe(Date.parse(SERVER_NOW));
  });

  it('keeps ticking by elapsed local time since the response', () => {
    const t = fakeTimers(0);
    const clock = createServerClock(t.monotonic, t.wall);
    clock.sync(SERVER_NOW);
    t.advance(30_000);
    expect(clock.now()).toBe(Date.parse(SERVER_NOW) + 30_000);
  });

  it('shows the same ETA with a device clock an hour fast, an hour slow, or correct', () => {
    const minutes = [-3_600_000, 0, 3_600_000].map((skew) => {
      const t = fakeTimers(Date.parse(SERVER_NOW) + skew);
      const clock = createServerClock(t.monotonic, t.wall);
      clock.sync(SERVER_NOW);
      t.advance(60_000);
      return minutesUntil(ARRIVAL, clock.now());
    });
    expect(minutes).toEqual([3, 3, 3]);
  });

  it('ignores an unparseable server time', () => {
    const t = fakeTimers(7_000);
    const clock = createServerClock(t.monotonic, t.wall);
    clock.sync('');
    expect(clock.now()).toBe(7_000);
  });

  it('ignores device wall-clock jumps after the first response', () => {
    const t = fakeTimers(0);
    const clock = createServerClock(t.monotonic, t.wall);
    clock.sync(SERVER_NOW);
    t.jumpWall(7_200_000);
    t.advance(10_000);
    expect(clock.now()).toBe(Date.parse(SERVER_NOW) + 10_000);
  });

  it('ignores a response older than the last accepted one', () => {
    const t = fakeTimers(0);
    const clock = createServerClock(t.monotonic, t.wall);
    clock.sync(SERVER_NOW);
    t.advance(5_000);
    clock.sync('2026-10-19T09:59:58Z');
    expect(clock.now()).toBe(Date.parse(SERVER_NOW) + 5_000);
  });

  it('accepts a fresh response even though now() has run ahead of its fetchedAt', () => {
    const t = fakeTimers(0);
    const clock = createServerClock(t.monotonic, t.wall);
    clock.sync(SERVER_NOW);
    t.advance(20_000);
    clock.sync('2026-10-19T10:00:18Z');
    expect(clock.now()).toBe(Date.parse('2026-10-19T10:00:18Z'));
  });

  it('accepts a response with the same fetchedAt', () => {
    const t = fakeTimers(0);
    const clock = createServerClock(t.monotonic, t.wall);
    clock.sync(SERVER_NOW);
    t.advance(1_000);
    clock.sync(SERVER_NOW);
    expect(clock.now()).toBe(Date.parse(SERVER_NOW));
  });
});
