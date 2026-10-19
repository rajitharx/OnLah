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
});
