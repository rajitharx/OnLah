import { useEffect, useRef, useState, type RefObject } from 'react';
import { crowdClass, crowdLabel } from '../../shared/utils/arrival';
import { collapseRail, type RailNode } from './railModel';
import { crowdLevelOf } from './trackerLabels';

const TAGS: Partial<Record<RailNode['state'], string>> = { user: "You're here" };

// One stop per node, in order. Passed stops are muted, stops after the user are lighter, and long stretches fold away.
export function Rail({ nodes }: { nodes: RailNode[] }) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const focusRef = useRef<HTMLLIElement>(null);
  const focusIndex = nodes.findIndex((node) => node.hasBus);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    focusRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [focusIndex]);

  const expand = (key: string): void => setExpanded((previous) => new Set(previous).add(key));

  return (
    <ol className="rail" aria-label="Stops on this route">
      {collapseRail(nodes, expanded).map((item) =>
        item.kind === 'gap' ? (
          <li key={`gap-${item.key}`} className="rail-gap">
            <button type="button" className="rail-gap-btn" aria-expanded="false" onClick={() => expand(item.key)}>
              +{item.count} stops
            </button>
          </li>
        ) : (
          <RailStop key={item.node.stop.sequence} node={item.node} refCallback={item.node.hasBus ? focusRef : null} />
        ),
      )}
    </ol>
  );
}

function RailStop({ node, refCallback }: { node: RailNode; refCallback: RefObject<HTMLLIElement> | null }) {
  const { stop, state, hasBus, busLoad, isNext } = node;
  const tag = TAGS[state];
  const crowd = busLoad === null ? null : crowdLevelOf(busLoad);
  const classes = [`rail-node rail-node-${state}`, hasBus && 'rail-node-bus', isNext && 'rail-node-next', crowd !== null && crowdClass(crowd)];

  return (
    <li
      ref={refCallback}
      className={classes.filter(Boolean).join(' ')}
      aria-current={state === 'user' ? 'location' : undefined}
    >
      <span className={markerClass(hasBus, isNext)} aria-hidden="true" />
      <div className="rail-body">
        <span className="rail-name">{stop.description}</span>
        <span className="rail-meta">{stop.busStopCode} · {stop.distanceKm.toFixed(1)} km</span>
        {hasBus && (
          <span className="rail-tag rail-tag-bus">
            Bus is here
            {crowd !== null && <span className="rail-tag-load"> · {crowdLabel(crowd)}</span>}
          </span>
        )}
        {tag !== undefined && <span className="rail-tag">{tag}</span>}
      </div>
    </li>
  );
}

function markerClass(hasBus: boolean, isNext: boolean): string {
  if (hasBus) return 'rail-marker rail-marker-bus';
  return isNext ? 'rail-marker rail-marker-next' : 'rail-marker';
}
