import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppHeader } from './AppHeader';

describe('AppHeader', () => {
  const html = renderToStaticMarkup(<AppHeader version="Beta 0.3" onHome={() => undefined} />);

  it('links the OnLah wordmark to the home page', () => {
    const tag = html.match(/<a[^>]*class="wordmark"[^>]*>/)?.[0] ?? '';
    expect(tag).toContain('href="/"');
    expect(html).toContain('>OnLah');
  });

  it('shows the version beside the wordmark', () => {
    expect(html).toContain('Beta 0.3');
  });
});
