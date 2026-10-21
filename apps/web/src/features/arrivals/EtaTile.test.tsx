import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ArrivalTiming, BusType } from '../../types/domain';
import { EtaTile } from './EtaTile';

const now = Date.parse('2026-10-19T10:00:00Z');

function timing(overrides: Partial<ArrivalTiming> = {}): ArrivalTiming {
  return {
    estimatedArrival: '2026-10-19T10:04:00Z',
    load: 2,
    isWheelchairAccessible: false,
    type: 0,
    isMonitored: true,
    isLastBus: false,
    ...overrides,
  };
}

function render(t: ArrivalTiming | null): string {
  return renderToStaticMarkup(<EtaTile timing={t} now={now} />);
}

describe('EtaTile', () => {
  it('shows the minutes with the min unit on every tile', () => {
    expect(render(timing())).toContain('<span class="eta-unit">min</span>');
  });

  it('keeps the same tile for the next bus and the later ones', () => {
    const html = render(timing());
    expect(html).not.toContain('eta-tile-next');
  });

  it('shows the deck type as text, without a bus icon', () => {
    const cases: [BusType, string][] = [
      [0, 'Single'],
      [1, 'Double'],
      [2, 'Bendy'],
    ];
    for (const [type, label] of cases) {
      const html = render(timing({ type }));
      expect(html).toContain(`>${label}<`);
      expect(html).not.toContain('<svg');
    }
  });

  it('tags the last bus in text and says so to screen readers', () => {
    const html = render(timing({ isLastBus: true }));
    expect(html).toContain('aria-label="4 minutes, Crowded, Single, last bus"');
    expect(html).toMatch(/>LAST</);
  });

  it('leaves the tag and the spoken last bus off every other tile', () => {
    const html = render(timing());
    expect(html).toContain('aria-label="4 minutes, Crowded, Single"');
    expect(html).not.toMatch(/LAST|last bus/i);
  });

  it('shows the crowd by colour alone, with no bar meter', () => {
    const html = render(timing());
    expect(html).not.toContain('crowd-bar');
    expect(html).toContain('crowd-crowded');
  });
});
