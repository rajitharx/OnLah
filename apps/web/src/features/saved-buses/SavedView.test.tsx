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

const withData: Record<string, ArrivalsState> = {
  '01012': {
    data: { stopCode: '01012', fetchedAt: '2026-10-19T10:00:00Z', services: [] },
    failed: false,
    slow: false,
  },
};

function render(buses: SavedBus[], arrivals: Record<string, ArrivalsState> = {}, stops: BusStop[] = []): string {
  return renderToStaticMarkup(
    <SavedView
      buses={buses}
      arrivals={arrivals}
      now={now}
      stops={stops}
      onOpenStop={noop}
      onOpenService={noop}
      onRemoveBus={noop}
      onRemoveStop={noop}
      onResync={noop}
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
    expect(render([bus('12'), bus('2')])).not.toContain('of 20');
  });

  it('shows the cap once the list is nearly full', () => {
    const buses = Array.from({ length: 15 }, (_, i) => bus(String(i + 1)));
    expect(render(buses)).toContain('15 of 20 buses saved');
  });

  it('shows when a stop\'s times were last updated', () => {
    expect(render([bus('12')], withData)).toContain('Updated 5s ago');
  });

  it('raises one alert, not one per card, when every stop failed', () => {
    const failed = (data: ArrivalsState['data']): ArrivalsState => ({ data, failed: true, slow: false });
    const arrivals = { '01012': failed(null), '01013': failed(withData['01012'].data) };
    const buses = [bus('12'), { ...bus('2'), stopCode: '01013' }];

    const html = render(buses, arrivals);

    expect(html.match(/role="alert"/g)).toHaveLength(1);
    expect(html).toContain('load bus times for your saved stops.');
  });

  it('raises no alert when only some stops failed', () => {
    const buses = [bus('12'), { ...bus('2'), stopCode: '01013' }];
    const arrivals = { '01012': { data: null, failed: true, slow: false }, '01013': withData['01012'] };

    expect(render(buses, arrivals)).not.toContain('role="alert"');
  });

  it('opens the bus details from the bus number, as a button', () => {
    expect(buttonTag(render([bus('12')], withData), 'Bus 12 details')).toContain('type="button"');
  });

  it('re-syncs a saved stop from its card', () => {
    expect(buttonTag(render([bus('12')], withData), 'Re-sync Victoria Lane')).not.toBe('');
  });

  it('shows the re-sync control as an icon, not as text', () => {
    const html = render([bus('12')], withData);
    expect(html).not.toContain('>Re-sync<');
    expect(buttonTag(html, 'Re-sync Victoria Lane')).toContain('class="icon-btn resync-btn"');
  });

  it('offers one re-sync per stop card and none on bus rows', () => {
    const html = render([bus('12'), bus('2')], withData);
    expect(html.match(/aria-label="Re-sync /g)).toHaveLength(1);
    expect(html).not.toContain('Re-sync bus');
  });

  it('no longer offers up and down moves', () => {
    const html = render([bus('12'), bus('2')], withData, [favourite]);
    expect(html).not.toContain('Move ');
  });

  it('warns with the data age and a retry on a stop whose refresh failed, keeping its times', () => {
    const failed = { '01012': { ...withData['01012'], failed: true } };
    const html = render([bus('12')], failed);
    expect(html).toContain('Showing data from 5s ago.');
    expect(html).toContain('>Try again<');
    expect(html).toContain('Bus 12 details');
  });

  it('shows the data age once on a failed stop, not again as a stale chip', () => {
    const failed = { '01012': { ...withData['01012'], failed: true } };
    const html = render([bus('12')], failed);
    expect(html.match(/\d+s ago/g)).toHaveLength(1);
    expect(html).not.toContain('Stale');
  });

  it('shows the Updated age when the refresh succeeded', () => {
    expect(render([bus('12')], withData)).toContain('Updated 5s ago');
  });

  it('shows no stale warning when the refresh succeeded', () => {
    expect(render([bus('12')], withData)).not.toContain('Showing data from');
  });
});
