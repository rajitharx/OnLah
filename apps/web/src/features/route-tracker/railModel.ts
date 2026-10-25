import type { TrackedBus, TrackerStop } from '../../types/routeTracker';

export type RailNodeState = 'passed' | 'bus' | 'ahead' | 'user' | 'beyond';

export interface RailNode {
  stop: TrackerStop;
  state: RailNodeState;
  hasBus: boolean;
  busLoad: TrackedBus['load'] | null;
  isNext: boolean;
}

export type RailItem =
  | { kind: 'stop'; node: RailNode }
  | { kind: 'gap'; key: string; count: number; nodes: RailNode[] };

const CONTEXT_STOPS = 2;
const MIN_HIDDEN_RUN = 3;

// A bus is always at or before the user's stop. On a loop the same code can repeat, so take the latest visit.
function findBusIndex(stops: TrackerStop[], userIndex: number, nearestStopCode: string | null): number | null {
  if (nearestStopCode === null) return null;
  for (let i = userIndex; i >= 0; i -= 1) {
    if (stops[i].busStopCode === nearestStopCode) return i;
  }
  return null;
}

function stateOf(index: number, userIndex: number, busIndex: number | null): RailNodeState {
  if (index === userIndex) return 'user';
  if (index > userIndex) return 'beyond';
  if (busIndex === null) return 'ahead';
  if (index < busIndex) return 'passed';
  return index === busIndex ? 'bus' : 'ahead';
}

// The bus load rides on the bus node, and the next stop is the one the bus is heading to, never past the user's stop.
export function buildRail(
  stops: TrackerStop[],
  userIndex: number,
  nearestStopCode: string | null,
  load: TrackedBus['load'] | null = null,
): RailNode[] {
  const busIndex = findBusIndex(stops, userIndex, nearestStopCode);
  return stops.map((stop, index) => ({
    stop,
    state: stateOf(index, userIndex, busIndex),
    hasBus: index === busIndex,
    busLoad: index === busIndex ? load : null,
    isNext: busIndex !== null && index === busIndex + 1 && index <= userIndex,
  }));
}

function anchorIndexes(nodes: RailNode[]): Set<number> {
  const anchors = new Set<number>();
  if (nodes.length === 0) return anchors;

  anchors.add(0);
  anchors.add(nodes.length - 1);
  nodes.forEach((node, index) => {
    if (node.state !== 'user' && !node.hasBus) return;
    for (let i = index - CONTEXT_STOPS; i <= index + CONTEXT_STOPS; i += 1) {
      if (i >= 0 && i < nodes.length) anchors.add(i);
    }
  });
  return anchors;
}

// Long routes keep the first and last stops and the stretch around the bus and the user. The rest folds into "+N stops".
export function collapseRail(nodes: RailNode[], expanded: ReadonlySet<string>): RailItem[] {
  const anchors = anchorIndexes(nodes);
  const items: RailItem[] = [];

  let index = 0;
  while (index < nodes.length) {
    if (anchors.has(index)) {
      items.push({ kind: 'stop', node: nodes[index] });
      index += 1;
      continue;
    }

    let end = index;
    while (end < nodes.length && !anchors.has(end)) end += 1;
    items.push(...hiddenRun(nodes.slice(index, end), String(index), expanded));
    index = end;
  }
  return items;
}

function hiddenRun(run: RailNode[], key: string, expanded: ReadonlySet<string>): RailItem[] {
  if (run.length < MIN_HIDDEN_RUN || expanded.has(key)) {
    return run.map((node): RailItem => ({ kind: 'stop', node }));
  }
  return [{ kind: 'gap', key, count: run.length, nodes: run }];
}
