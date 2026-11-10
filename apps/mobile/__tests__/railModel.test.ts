import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RailItem, buildRail, collapseRail } from '../src/features/route-tracker/railModel';
import { TrackerStop } from '../src/types/domain';

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

function isStop(item: RailItem): item is Extract<RailItem, { kind: 'stop' }> {
  return item.kind === 'stop';
}

const shownSequences = (items: RailItem[]): number[] => items.filter(isStop).map((i) => i.node.stop.sequence);

test('mutes stops the bus has passed and lightens the stops after the user', () => {
  assert.deepEqual(states(buildRail(stops(10), 7, 'S5')), [
    'passed', 'passed', 'passed', 'passed', 'bus', 'ahead', 'ahead', 'user', 'beyond', 'beyond',
  ]);
});

test('marks the user stop as holding the bus when the bus is there', () => {
  const rail = buildRail(stops(10), 7, 'S8');
  assert.equal(rail[7].state, 'user');
  assert.equal(rail[7].hasBus, true);
});

test('shows no bus and mutes nothing when the position is unknown', () => {
  const rail = buildRail(stops(10), 7, null);
  assert.deepEqual(states(rail).slice(0, 7), Array(7).fill('ahead'));
  assert.equal(rail.some((n) => n.hasBus), false);
});

test('ignores a bus position after the user stop, since that bus has already gone', () => {
  assert.equal(buildRail(stops(10), 4, 'S9').some((n) => n.hasBus), false);
});

test('places a bus at a repeated stop on its latest visit before the user stop', () => {
  const loop = [...stops(5), { ...stops(1)[0], sequence: 6 }];
  const rail = buildRail(loop, 5, 'S1');
  assert.deepEqual(rail.filter((n) => n.hasBus).map((n) => n.stop.sequence), [6]);
});

test('carries the bus load on the stop where the bus is and nowhere else', () => {
  const rail = buildRail(stops(10), 7, 'S5', 'SDA');
  assert.deepEqual(rail.map((n) => n.busLoad), [null, null, null, null, 'SDA', null, null, null, null, null]);
});

test('has no load when the load is not given', () => {
  assert.equal(buildRail(stops(10), 7, 'S5').every((n) => n.busLoad === null), true);
});

test('marks the stop right after the bus as the next stop', () => {
  const rail = buildRail(stops(10), 7, 'S5', 'SEA');
  assert.deepEqual(rail.filter((n) => n.isNext).map((n) => n.stop.sequence), [6]);
});

test('marks the user stop as next when the bus is one stop before it', () => {
  assert.equal(buildRail(stops(10), 7, 'S7', 'SEA')[7].isNext, true);
});

test('has no next stop when the bus is at the user stop or its position is unknown', () => {
  assert.equal(buildRail(stops(10), 7, 'S8', 'SEA').some((n) => n.isNext), false);
  assert.equal(buildRail(stops(10), 7, null, 'SEA').some((n) => n.isNext), false);
});

const long = buildRail(stops(30), 22, 'S11');

test('collapseRail keeps the first stop, the last stop, and the stops around the bus and the user', () => {
  assert.deepEqual(shownSequences(collapseRail(long, new Set())), [1, 9, 10, 11, 12, 13, 21, 22, 23, 24, 25, 30]);
});

test('collapseRail replaces each far stretch with a row saying how many stops it hides', () => {
  const gaps = collapseRail(long, new Set()).flatMap((i) => (i.kind === 'gap' ? [i.count] : []));
  assert.deepEqual(gaps, [7, 7, 4]);
});

test('collapseRail shows a hidden stretch when it is expanded', () => {
  const first = collapseRail(long, new Set()).find((i) => i.kind === 'gap');
  assert.ok(first && first.kind === 'gap');

  const items = collapseRail(long, new Set([first.key]));

  assert.ok(shownSequences(items).includes(5));
  assert.equal(items.filter((i) => i.kind === 'gap').length, 2);
});

test('collapseRail keys a hidden stretch by its first stop, so it stays expanded when the bus moves', () => {
  const first = collapseRail(buildRail(stops(30), 22, 'S11'), new Set()).find((i) => i.kind === 'gap');
  assert.ok(first && first.kind === 'gap');
  assert.equal(first.key, '2');

  const items = collapseRail(buildRail(stops(30), 22, 'S12'), new Set([first.key]));

  assert.ok(shownSequences(items).includes(2));
  assert.equal(items.some((i) => i.kind === 'gap' && i.key === '2'), false);
});

test('collapseRail does not hide a stretch of only one or two stops', () => {
  const short = buildRail(stops(12), 8, 'S2');
  assert.equal(collapseRail(short, new Set()).every((i) => i.kind === 'stop'), true);
});

test('collapseRail anchors on the user stop alone when the bus position is unknown', () => {
  const items = collapseRail(buildRail(stops(30), 15, null), new Set());
  assert.deepEqual(shownSequences(items), [1, 14, 15, 16, 17, 18, 30]);
});
