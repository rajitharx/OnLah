// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { TrackerStop } from '../../types/routeTracker';
import { Rail } from './Rail';
import { buildRail } from './railModel';

const stops: TrackerStop[] = Array.from({ length: 15 }, (_, i) => ({
  sequence: i + 1,
  busStopCode: `S${i + 1}`,
  description: `Stop ${i + 1}`,
  roadName: 'Road',
  distanceKm: i * 0.4,
}));

beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(cleanup);

describe('Rail', () => {
  it('moves focus to the first revealed stop when a folded section opens', () => {
    const { container } = render(<Rail nodes={buildRail(stops, 14, 'S3')} />);

    fireEvent.click(screen.getByRole('button', { name: '+7 stops' }));

    expect(screen.queryByRole('button', { name: /stops$/ })).toBeNull();
    const first = container.querySelector<HTMLElement>('[data-sequence="6"]');
    expect(first).not.toBeNull();
    expect(document.activeElement).toBe(first);
  });
});
