import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { RouteTracker, TrackedBus, TrackerStop } from '../../types/routeTracker';
import { TrackerContent } from './TrackerContent';
import { EMPTY_TRACKER, type TrackerState } from './trackerState';

const NOW = Date.parse('2026-10-21T12:00:05Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

const stops: TrackerStop[] = Array.from({ length: 5 }, (_, i) => ({
  sequence: i + 1,
  busStopCode: `S${i + 1}`,
  description: i === 4 ? 'Terminus' : `Stop ${i + 1}`,
  roadName: 'Road',
  distanceKm: i * 0.4,
}));

function bus(overrides: Partial<TrackedBus> = {}): TrackedBus {
  return {
    estimatedArrival: '2026-10-21T12:06:00Z',
    etaMinutes: 6,
    etaLabel: '6 min',
    load: 'SEA',
    feature: null,
    type: 'SD',
    monitored: true,
    stopsAway: 3,
    nearestStopCode: 'S2',
    ...overrides,
  };
}

function tracker(overrides: Partial<RouteTracker> = {}): RouteTracker {
  return {
    serviceNo: '161',
    direction: 1,
    status: 'live',
    fetchedAt: '2026-10-21T12:00:00Z',
    destination: stops[4],
    userStopIndex: 3,
    stops,
    buses: [bus()],
    ...overrides,
  };
}

function render(state: Partial<TrackerState>, stale = false): string {
  return renderToStaticMarkup(
    <TrackerContent
      state={{ ...EMPTY_TRACKER, ...state, receivedAt: state.data ? NOW : null }}
      stopCode="67009"
      serviceNo="161"
      stale={stale}
      onRetry={() => undefined}
    />,
  );
}

describe('TrackerContent states', () => {
  it('shows a loading skeleton before the first response', () => {
    expect(render({})).toContain('aria-busy="true"');
  });

  it('says so when the stop or service does not exist, without a retry', () => {
    const html = render({ notFound: true });

    expect(html).toContain('161');
    expect(html).toContain('67009');
    expect(html).toContain('not found');
    expect(html).not.toContain('>Try again<');
  });

  it('shows an error with a retry when the first load fails', () => {
    const html = render({ failed: true });

    expect(html).toContain('role="alert"');
    expect(html).toContain('>Try again<');
  });

  it('keeps the last known tracker and shows its age once when a refresh fails', () => {
    const html = render({ data: tracker(), failed: true }, true);

    expect(html).toContain('Showing data from 5s ago.');
    expect(html.match(/5s ago/g)).toHaveLength(1);
    expect(html).not.toContain('Stale');
    expect(html).toContain('3 stops away');
  });

  it('marks old data as stale without a failed refresh, such as a hidden tab', () => {
    const html = render({ data: tracker() }, true);

    expect(html).toContain('Stale · Updated 5s ago');
    expect(html).not.toContain("Couldn't refresh");
  });
});

describe('TrackerContent live', () => {
  const html = render({ data: tracker() });

  it('shows the stops-away countdown in a polite live region', () => {
    expect(html).toMatch(/aria-live="polite"[^>]*>[^]*3 stops away/);
  });

  it('shows the ETA and the crowd level in words as well as colour', () => {
    expect(html).toContain('6 min');
    expect(html).toContain('Seats');
  });

  it('names the service, the destination and the user stop in the header', () => {
    expect(html).toContain('161');
    expect(html).toContain('To Terminus');
    expect(html).toContain('Stop 4');
  });

  it('marks the user stop and the bus on a semantic ordered list', () => {
    expect(html).toContain('<ol');
    expect(html).toContain('aria-current="location"');
    expect(html).toContain('You&#x27;re here');
    expect(html).toContain('Bus is here');
  });

  it('shows the stop code and distance on each stop', () => {
    expect(html).toContain('S3');
    expect(html).toContain('0.8 km');
  });
});

describe('countdown wording', () => {
  it('uses the singular for one stop', () => {
    expect(render({ data: tracker({ buses: [bus({ stopsAway: 1 })] }) })).toContain('1 stop away');
  });

  it('says Arriving when the bus is at the stop', () => {
    expect(render({ data: tracker({ buses: [bus({ stopsAway: 0, etaLabel: 'Arr', etaMinutes: 0 })] }) })).toContain('Arriving');
  });

  it('spells out "under 1 min" beside Arriving instead of the Arr jargon', () => {
    const html = render({ data: tracker({ buses: [bus({ stopsAway: 0, etaLabel: 'Arr', etaMinutes: 0 })] }) });

    expect(html).toContain('ETA under 1 min');
    expect(html).not.toContain('ETA Arr');
  });

  it('shows the ETA alone when the position is unknown, never a wrong stop count', () => {
    const html = render({ data: tracker({ buses: [bus({ stopsAway: null, nearestStopCode: null })] }) });

    expect(html).toContain('6 min');
    expect(html).not.toContain('stops away');
    expect(html).not.toContain('Bus is here');
  });
});

describe('rail bus indicator', () => {
  const liOf = (html: string, marker: string): string => html.split('<li').find((li) => li.includes(marker)) ?? '';

  it('colours the bus stop by the seating level and names it in words', () => {
    const html = render({ data: tracker({ buses: [bus({ load: 'LSD' })] }) });
    const busStop = liOf(html, 'rail-marker-bus');

    expect(busStop).toContain('crowd-crowded');
    expect(busStop).toContain('Crowded');
    expect(html.match(/crowd-crowded/g)?.length).toBeGreaterThanOrEqual(1);
  });

  it('uses the seats colour for a bus with seats free', () => {
    const html = render({ data: tracker({ buses: [bus({ load: 'SEA' })] }) });

    expect(liOf(html, 'rail-marker-bus')).toContain('crowd-seats');
  });

  it('marks exactly one next stop on the rail', () => {
    const html = render({ data: tracker() });

    expect(html.match(/rail-node-next/g)).toHaveLength(1);
  });

  it('marks no next stop when the position is unknown', () => {
    const html = render({ data: tracker({ buses: [bus({ stopsAway: null, nearestStopCode: null })] }) });

    expect(html).not.toContain('rail-node-next');
    expect(html).not.toContain('rail-marker-bus');
  });
});

describe('scheduled and empty statuses', () => {
  it('flags a scheduled bus with a clock and the word Scheduled', () => {
    const html = render({ data: tracker({ status: 'scheduled', buses: [bus({ monitored: false, stopsAway: null, nearestStopCode: null })] }) });

    expect(html).toContain('Scheduled');
    expect(html).toContain('data-icon="clock"');
    expect(html).not.toContain('stops away');
  });

  it('says No Est. Available when the service should run but LTA has no estimate', () => {
    expect(render({ data: tracker({ status: 'noEstimate', buses: [] }) })).toContain('No Est. Available');
  });

  it('says Not In Operation outside the timetable', () => {
    expect(render({ data: tracker({ status: 'notInOperation', buses: [] }) })).toContain('Not In Operation');
  });

  it('still shows the route when there are no buses', () => {
    expect(render({ data: tracker({ status: 'notInOperation', buses: [] }) })).toContain('Stop 2');
  });
});

describe('next buses strip', () => {
  const later = [bus(), bus({ etaMinutes: 14, etaLabel: '14 min', stopsAway: 7, feature: 'WAB', load: 'LSD' })];

  it('lists the later buses with their ETA and crowd', () => {
    const html = render({ data: tracker({ buses: later }) });

    expect(html).toContain('14 min');
    expect(html).toContain('Crowded');
  });

  it('shows a wheelchair mark with a label for a wheelchair accessible bus', () => {
    expect(render({ data: tracker({ buses: later }) })).toContain('Wheelchair accessible');
  });

  it('hides the strip when there is only one bus', () => {
    expect(render({ data: tracker() })).not.toContain('Later buses');
  });
});
