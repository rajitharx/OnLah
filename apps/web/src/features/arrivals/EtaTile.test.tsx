import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { EtaTile } from './EtaTile';

describe('EtaTile', () => {
  it('shows the crowd by its colour alone, with no bar meter', () => {
    const timing = {
      estimatedArrival: '2026-10-19T10:04:00Z',
      load: 2 as const,
      isWheelchairAccessible: false,
      type: 0 as const,
      isMonitored: true,
    };
    const html = renderToStaticMarkup(<EtaTile timing={timing} now={Date.parse('2026-10-19T10:00:00Z')} next={true} />);
    expect(html).not.toContain('crowd-bar');
    expect(html).toContain('crowd-crowded');
  });
});
