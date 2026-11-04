import { useEffect, useRef } from 'react';
import { focusHeading } from './viewTitle';

export const FOCUS_WAIT_MS = 4000;

// Sets the tab title, and moves focus to the heading when the screen changes after the first load.
// The heading can arrive later than the route (a stop loaded from a link), so focus waits for it,
// but only for FOCUS_WAIT_MS: a screen that never gets a heading must not pull focus later.
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
    const timer = setTimeout(() => {
      pendingFocus.current = false;
    }, FOCUS_WAIT_MS);
    return () => clearTimeout(timer);
  }, [key]);

  useEffect(() => {
    if (pendingFocus.current && focusHeading(document)) pendingFocus.current = false;
  });
}
