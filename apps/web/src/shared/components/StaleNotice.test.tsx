import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaleNotice } from './StaleNotice';

const NOW = Date.parse('2026-10-26T10:01:00Z');

function render(fetchedAt = '2026-10-26T10:00:00Z'): string {
  return renderToStaticMarkup(<StaleNotice fetchedAt={fetchedAt} now={NOW} onRetry={() => undefined} />);
}

describe('StaleNotice', () => {
  it('says the refresh failed and how old the data on screen is', () => {
    expect(render()).toContain("Couldn&#x27;t refresh. Showing data from 60s ago.");
  });

  it('offers a retry button', () => {
    expect(render()).toMatch(/<button[^>]*type="button"[^>]*>Try again<\/button>/);
  });

  it('is announced, but not as the red error style that means crowded', () => {
    const html = render();
    expect(html).toContain('role="alert"');
    expect(html).toContain('stale-notice');
    expect(html).not.toContain('class="error"');
  });

  it('never shows a negative or NaN age for an unreadable timestamp', () => {
    expect(render('not a date')).toContain('Showing data from 0s ago.');
  });
});
