import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Freshness } from './Freshness';

const NOW = Date.parse('2026-10-26T10:00:30Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Freshness', () => {
  it('says how many seconds old the data is', () => {
    expect(renderToStaticMarkup(<Freshness fetchedAt="2026-10-26T10:00:00Z" />)).toContain('Updated 30s ago');
  });

  it('says Stale in words when stale', () => {
    const html = renderToStaticMarkup(<Freshness fetchedAt="2026-10-26T10:00:00Z" stale />);
    expect(html).toContain('Stale · Updated 30s ago');
    expect(html).toContain('freshness-stale');
  });

  it('never shows a negative or NaN age for a future or unreadable timestamp', () => {
    expect(renderToStaticMarkup(<Freshness fetchedAt="2026-10-26T11:00:00Z" />)).toContain('Updated 0s ago');
    expect(renderToStaticMarkup(<Freshness fetchedAt="not a date" />)).toContain('Updated 0s ago');
  });
});
