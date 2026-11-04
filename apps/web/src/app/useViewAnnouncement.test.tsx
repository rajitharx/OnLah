// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { FOCUS_WAIT_MS, useViewAnnouncement } from './useViewAnnouncement';

function Screen({ viewKey, heading }: { viewKey: string; heading: boolean }) {
  useViewAnnouncement(viewKey, `Title ${viewKey}`);
  return <main>{heading && <h1>Heading</h1>}</main>;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('useViewAnnouncement', () => {
  it('sets the title but leaves focus alone on the first load', () => {
    render(<Screen viewKey="a" heading />);
    expect(document.title).toBe('Title a');
    expect(document.activeElement).toBe(document.body);
  });

  it('focuses the heading after a screen change, waiting for a late one', () => {
    const { rerender } = render(<Screen viewKey="a" heading={false} />);
    rerender(<Screen viewKey="b" heading={false} />);
    expect(document.activeElement).toBe(document.body);

    rerender(<Screen viewKey="b" heading />);
    expect(document.activeElement?.tagName).toBe('H1');
  });

  it('gives up when no heading arrives in time', () => {
    const { rerender } = render(<Screen viewKey="a" heading={false} />);
    rerender(<Screen viewKey="b" heading={false} />);

    act(() => {
      vi.advanceTimersByTime(FOCUS_WAIT_MS + 1);
    });
    rerender(<Screen viewKey="b" heading />);

    expect(document.activeElement).toBe(document.body);
  });
});
