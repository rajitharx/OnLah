import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BoardLegend } from './BoardLegend';

describe('BoardLegend', () => {
  const html = renderToStaticMarkup(<BoardLegend />);

  it('explains the crowd colours and the wheelchair mark', () => {
    expect(html).toContain('Standing');
    expect(html).toContain('Wheelchair accessible');
  });

  it('no longer explains bus types, since the tiles spell them out', () => {
    expect(html).not.toContain('single deck');
    expect(html).not.toContain('double deck');
    expect(html).not.toContain('SD');
  });
});
