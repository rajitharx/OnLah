import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { BusArrival, BusStop } from '../../types/domain';
import { StopBoard } from './StopBoard';

const stop: BusStop = {
  busStopCode: '01121',
  roadName: 'Aft Victoria Lane',
  description: 'Aft Victoria Lane',
  latitude: 1.3,
  longitude: 103.8,
  distanceMeters: 0,
};

function service(serviceNo: string): BusArrival {
  return { serviceNo, operator: 'GAS', nextBus: null, nextBus2: null, nextBus3: null };
}

function render(services: BusArrival[]): string {
  return renderToStaticMarkup(
    <StopBoard
      stop={stop}
      arrivals={{
        data: { stopCode: stop.busStopCode, fetchedAt: '2026-10-19T10:00:00Z', services },
        failed: false,
        slow: false,
      }}
      now={Date.parse('2026-10-19T10:00:05Z')}
      isFavourite={false}
      favouritesFull={false}
      onToggleFavourite={() => undefined}
      isBusSaved={() => false}
      savedBusesFull={false}
      onToggleBus={() => undefined}
      openService={null}
      onOpenService={() => undefined}
      onCloseService={() => undefined}
      onBack={() => undefined}
      onRefresh={() => undefined}
    />,
  );
}

describe('StopBoard', () => {
  it('lists services in numeric order, not text order', () => {
    const html = render(['130', '12', '2', '961M', '10e'].map(service));
    const order = ['Bus 2 details', 'Bus 10e details', 'Bus 12 details', 'Bus 130 details', 'Bus 961M details'];
    const positions = order.map((label) => html.indexOf(label));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('offers a back control that does not depend on the tabs', () => {
    expect(render([])).toContain('← Back');
  });

  it('labels the stop button as saving the stop, not a bus', () => {
    const html = render([]);
    expect(html).toContain('Save stop');
    expect(html).not.toContain('>Save<');
  });

  it('links to the stop in a map app', () => {
    expect(render([])).toContain('href="https://www.google.com/maps/search/?api=1&amp;query=1.3,103.8"');
  });

  it('says where the times come from, in place of a footer', () => {
    expect(render([])).toContain('LTA DataMall');
  });

  it('offers a manual refresh as a recycle icon, with a label for screen readers', () => {
    const html = render([]);
    expect(html).toContain('aria-label="Refresh bus times"');
    expect(html).not.toContain('>Refresh<');
  });

  it('puts the map link under the address, not in the controls row', () => {
    const html = render([]);
    const address = html.indexOf('class="stop-road"');
    const link = html.indexOf('Show in Maps');
    expect(address).toBeGreaterThan(-1);
    expect(link).toBeGreaterThan(address);
    expect(html).not.toContain('Open in Maps');
  });

  it('explains the crowd colours and the wheelchair mark', () => {
    const html = render([service('12')]);
    expect(html).toContain('How to read the times');
    expect(html).toContain('Standing');
    expect(html).toContain('Wheelchair accessible');
  });
});
