import { MAX_FAVOURITES, isNearLimit } from '../../shared/utils/limits';

export type LandingTab = 'SavedTab' | 'SearchTab';

// Someone with saved stops wants their board first. A first-time visitor has nothing saved, so Search is the way in.
export function defaultTab(hasSaved: boolean): LandingTab {
  return hasSaved ? 'SavedTab' : 'SearchTab';
}

// The cap only matters once the list is nearly full.
export function savedStopsCaption(count: number): string | null {
  return isNearLimit(count, MAX_FAVOURITES) ? `${count} of ${MAX_FAVOURITES} stops saved on this device` : null;
}
