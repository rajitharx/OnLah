import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  const html = renderToStaticMarkup(<AppHeader version="Beta 0.3" apiStatus="checking" onHome={() => undefined} />);

  it('links the OnLah wordmark to the home page', () => {
    const tag = html.match(/<a[^>]*class="wordmark"[^>]*>/)?.[0] ?? '';
    expect(tag).toContain('href="/"');
    expect(html).toContain('>OnLah');
  });

  it('shows the version beside the wordmark', () => {
    expect(html).toContain('Beta 0.3');
  });

  it.each([
    ['good', 'Live data is online'],
    ['slow', 'Live data is slow'],
    ['down', 'Live data is offline'],
    ['checking', 'Checking live data'],
  ] as const)('shows the %s status as a labelled dot', (status, label) => {
    const markup = renderToStaticMarkup(<AppHeader version="Beta 0.3" apiStatus={status} onHome={() => undefined} />);
    const dot = markup.match(/<span[^>]*class="api-dot[^"]*"[^>]*>/)?.[0] ?? '';
    expect(dot).toContain(`api-dot-${status}`);
    expect(dot).toContain(`aria-label="${label}"`);
  });
});
