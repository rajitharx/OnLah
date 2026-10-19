import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { BusStop } from '../../types/domain';
import { SavedView } from './SavedView';
import type { SavedBus } from './savedBusesStore';
import type { ArrivalsState } from '../arrivals/arrivalsState';

const noop = (): void => undefined;
const now = Date.parse('2026-10-19T10:00:05Z');

function bus(serviceNo: string): SavedBus {
  return { stopCode: '01012', serviceNo, stopName: 'Victoria Lane', roadName: 'Victoria St', latitude: 1.3, longitude: 103.8 };
}

const favourite: BusStop = {
  busStopCode: '01013',
  roadName: 'Victoria St',
  description: 'Hotel Grand',
  latitude: 1.3,
  longitude: 103.8,
  distanceMeters: 0,
};

function render(buses: SavedBus[], arrivals: Record<string, ArrivalsState> = {}, stops: BusStop[] = []): string {
  return renderToStaticMarkup(
    <SavedView
      buses={buses}
      arrivals={arrivals}
      now={now}
      stops={stops}
      onOpenStop={noop}
      onRemoveBus={noop}
      onRemoveStop={noop}
      onMoveBus={noop}
      onMoveStop={noop}
      onNavigate={noop}
    />,
  );
}

function buttonTag(html: string, label: string): string {
  return html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0] ?? '';
}

describe('SavedView', () => {
  it('labels the buses section, as the stops section already is', () => {
    expect(render([bus('12')])).toContain('Saved buses');
  });

  it('offers a way to find a stop from each empty list', () => {
    const html = render([]);
    expect(html).toContain('Search stops');
    expect(html).toContain('Find nearby');
  });

  it('does not show the cap while there is plenty of room', () => {
    const html = render([bus('12'), bus('2')]);
    expect(html).not.toContain('of 20');
  });

  it('shows the cap once the list is nearly full', () => {
    const buses = Array.from({ length: 15 }, (_, i) => bus(String(i + 1)));
    expect(render(buses)).toContain('15 of 20 buses saved');
  });

  it('shows when a stop\'s times were last updated', () => {
    const arrivals = {
      '01012': {
        data: { stopCode: '01012', fetchedAt: '2026-10-19T10:00:00Z', services: [] },
        failed: false,
        slow: false,
      },
    };
    expect(render([bus('12')], arrivals)).toContain('Updated 5s ago');
  });

  it('lets each saved bus move up or down, with the first and last ones held in place', () => {
    const html = render([bus('12'), bus('2')], {
      '01012': { data: { stopCode: '01012', fetchedAt: '2026-10-19T10:00:00Z', services: [] }, failed: false, slow: false },
    });
    expect(buttonTag(html, 'Move bus 12 up')).toContain('disabled');
    expect(buttonTag(html, 'Move bus 2 down')).toContain('disabled');
    expect(buttonTag(html, 'Move bus 12 down')).not.toContain('disabled');
  });

  it('lets saved stops move too', () => {
    expect(render([], {}, [favourite])).toContain('Move Hotel Grand down');
  });
});
