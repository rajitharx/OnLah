import { AppState } from 'react-native';
import type { Visibility } from './poller';

// The app counts as visible only in the foreground.
export const appVisibility: Visibility = {
  isActive: () => AppState.currentState === 'active',
  subscribe(onChange) {
    const subscription = AppState.addEventListener('change', (state) => onChange(state === 'active'));
    return () => subscription.remove();
  },
};
