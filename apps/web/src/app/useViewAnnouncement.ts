import { useEffect, useRef } from 'react';
import { focusHeading } from './viewTitle';

export const FOCUS_WAIT_MS = 4000;

// Sets the tab title, and moves focus to the heading when the screen changes after the first load.
// The heading can arrive later than the route (a stop loaded from a link), and from a child's own render,
// so a DOM observer waits for it, but only for FOCUS_WAIT_MS: a screen that never gets a heading must not
// pull focus later.
export function useViewAnnouncement(key: string, title: string): void {
  const previousKey = useRef(key);
  const pendingFocus = useRef(false);

  useEffect(() => {
    document.title = title;
  }, [title]);

  if (previousKey.current !== key) {
    previousKey.current = key;
    pendingFocus.current = true;
  }

  useEffect(() => {
    if (!pendingFocus.current) return;
    if (focusHeading(document)) {
      pendingFocus.current = false;
      return;
    }
    const stop = (): void => {
      pendingFocus.current = false;
      observer.disconnect();
      clearTimeout(timer);
    };
    const observer = new MutationObserver(() => {
      if (focusHeading(document)) stop();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = setTimeout(stop, FOCUS_WAIT_MS);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [key]);
}
