import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SearchView } from './SearchView';

function render(query: string): string {
  return renderToStaticMarkup(<SearchView query={query} onQueryChange={() => undefined} onOpen={() => undefined} />);
}

describe('SearchView', () => {
  it('says it is searching while a valid query is in flight', () => {
    expect(render('Victoria')).toContain('Searching…');
  });

  it('offers a Clear control once there is something to clear', () => {
    expect(render('Victoria')).toContain('aria-label="Clear search"');
    expect(render('')).not.toContain('aria-label="Clear search"');
  });
});
