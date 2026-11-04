import { describe, expect, it } from 'vitest';
import type { TrackerStop } from '../../types/routeTracker';
import { buildRail, collapseRail, type RailItem } from './railModel';

function stops(count: number): TrackerStop[] {
  return Array.from({ length: count }, (_, i) => ({
    sequence: i + 1,
    busStopCode: `S${i + 1}`,
    description: `Stop ${i + 1}`,
    roadName: 'Road',
    distanceKm: i * 0.4,
  }));
}

const states = (nodes: ReturnType<typeof buildRail>): string[] => nodes.map((n) => n.state);

describe('buildRail', () => {
  it('mutes stops the bus has passed and lightens the stops after the user', () => {
    const rail = buildRail(stops(10), 7, 'S5');

    expect(states(rail)).toEqual([
      'passed', 'passed', 'passed', 'passed', 'bus', 'ahead', 'ahead', 'user', 'beyond', 'beyond',
    ]);
  });

  it('marks the user stop as holding the bus when the bus is there', () => {
    const rail = buildRail(stops(10), 7, 'S8');

    expect(rail[7].state).toBe('user');
    expect(rail[7].hasBus).toBe(true);
  });

  it('shows no bus and mutes nothing when the position is unknown', () => {
    const rail = buildRail(stops(10), 7, null);

    expect(states(rail).slice(0, 7)).toEqual(Array(7).fill('ahead'));
    expect(rail.some((n) => n.hasBus)).toBe(false);
  });

  it('ignores a bus position after the user stop, since that bus has already gone', () => {
    const rail = buildRail(stops(10), 4, 'S9');

    expect(rail.some((n) => n.hasBus)).toBe(false);
  });

  it('places a bus at a repeated stop on its latest visit before the user stop', () => {
    const loop = [...stops(5), { ...stops(1)[0], sequence: 6 }];

    const rail = buildRail(loop, 5, 'S1');

    expect(rail.filter((n) => n.hasBus).map((n) => n.stop.sequence)).toEqual([6]);
  });
});

describe('buildRail bus load and next stop', () => {
  it('carries the bus load on the stop where the bus is and nowhere else', () => {
    const rail = buildRail(stops(10), 7, 'S5', 'SDA');

    expect(rail.map((n) => n.busLoad)).toEqual([null, null, null, null, 'SDA', null, null, null, null, null]);
  });

  it('has no load when the load is not given', () => {
    expect(buildRail(stops(10), 7, 'S5').every((n) => n.busLoad === null)).toBe(true);
  });

  it('marks the stop right after the bus as the next stop', () => {
    const rail = buildRail(stops(10), 7, 'S5', 'SEA');

    expect(rail.filter((n) => n.isNext).map((n) => n.stop.sequence)).toEqual([6]);
  });

  it('marks the user stop as next when the bus is one stop before it', () => {
    const rail = buildRail(stops(10), 7, 'S7', 'SEA');

    expect(rail[7].isNext).toBe(true);
  });

  it('has no next stop when the bus is at the user stop or its position is unknown', () => {
    expect(buildRail(stops(10), 7, 'S8', 'SEA').some((n) => n.isNext)).toBe(false);
    expect(buildRail(stops(10), 7, null, 'SEA').some((n) => n.isNext)).toBe(false);
  });
});

describe('collapseRail', () => {
  const long = buildRail(stops(30), 22, 'S11');

  it('keeps the first stop, the last stop, and the stops around the bus and the user', () => {
    const items = collapseRail(long, new Set());

    const shown = items.filter(isStop).map((i) => i.node.stop.sequence);
    expect(shown).toEqual([1, 9, 10, 11, 12, 13, 21, 22, 23, 24, 25, 30]);
  });

  it('replaces each far stretch with a row saying how many stops it hides', () => {
    const gaps = collapseRail(long, new Set()).filter((i) => i.kind === 'gap');

    expect(gaps.map((g) => g.count)).toEqual([7, 7, 4]);
  });

  it('shows a hidden stretch when it is expanded', () => {
    const first = collapseRail(long, new Set()).find((i) => i.kind === 'gap')!;

    const items = collapseRail(long, new Set([first.key]));

    expect(items.filter(isStop).map((i) => i.node.stop.sequence)).toContain(5);
    expect(items.filter((i) => i.kind === 'gap')).toHaveLength(2);
  });

  it('keys a hidden stretch by its first stop, so it stays expanded when the bus moves', () => {
    const before = buildRail(stops(30), 22, 'S11');
    const after = buildRail(stops(30), 22, 'S12');
    const first = collapseRail(before, new Set()).find((i) => i.kind === 'gap')!;
    expect(first.key).toBe('2');

    const items = collapseRail(after, new Set([first.key]));

    expect(items.filter(isStop).map((i) => i.node.stop.sequence)).toContain(2);
    expect(items.filter((i) => i.kind === 'gap').map((g) => g.key)).not.toContain('2');
  });

  it('does not hide a stretch of only one or two stops', () => {
    const short = buildRail(stops(12), 8, 'S2');

    expect(collapseRail(short, new Set()).every((i) => i.kind === 'stop')).toBe(true);
  });

  it('anchors on the user stop alone when the bus position is unknown', () => {
    const items = collapseRail(buildRail(stops(30), 15, null), new Set());

    expect(items.filter(isStop).map((i) => i.node.stop.sequence)).toEqual([1, 14, 15, 16, 17, 18, 30]);
  });
});

function isStop(item: RailItem): item is Extract<RailItem, { kind: 'stop' }> {
  return item.kind === 'stop';
}
