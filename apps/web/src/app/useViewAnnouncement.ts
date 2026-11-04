import { useEffect, useRef } from 'react';
import { focusHeading } from './viewTitle';

// Sets the tab title, and moves focus to the heading when the screen changes after the first load.
// The heading can arrive later than the route (a stop loaded from a link), so focus waits for it.
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
    if (pendingFocus.current && focusHeading(document)) pendingFocus.current = false;
  });
}
