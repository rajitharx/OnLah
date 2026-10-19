import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { BusStop } from '../../types/domain';
import { StopCard } from './StopCard';

const stop: BusStop = {
  busStopCode: '01012',
  roadName: 'Victoria St',
  description: 'Victoria Hotel',
  latitude: 1.3,
  longitude: 103.8,
  distanceMeters: 0,
};

describe('StopCard', () => {
  it('bolds the part of the name that matched the search', () => {
    expect(renderToStaticMarkup(<StopCard stop={stop} onOpen={() => undefined} highlight="victoria" />)).toContain(
      '<strong class="match">Victoria</strong>',
    );
  });

  it('shows no bold when there is no search term', () => {
    expect(renderToStaticMarkup(<StopCard stop={stop} onOpen={() => undefined} />)).not.toContain('class="match"');
  });
});
