import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NearbyView } from './NearbyView';
import { NEARBY_RADIUS_M } from './useNearbyStops';

describe('NearbyView', () => {
  const html = renderToStaticMarkup(<NearbyView onOpen={() => undefined} onNavigate={() => undefined} />);

  it('shows the sharing message once, in the empty state', () => {
    expect(html.split('Nearby stops appear once you share your location.').length - 1).toBe(1);
    expect(html).not.toContain('Share your location to see stops nearby.');
  });

  it('says why location is needed, and that it is not kept', () => {
    expect(html).toContain('used only to find stops near you');
  });

  it('searches within 1 km', () => {
    expect(NEARBY_RADIUS_M).toBe(1_000);
  });
});
