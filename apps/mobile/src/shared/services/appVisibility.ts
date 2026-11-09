import { AppState } from 'react-native';
import type { Visibility } from './poller';

// Only the background pauses polling. iOS reports 'inactive' for brief moments (notification shade, permission
// dialogs), and those must not trigger a refetch.
export const appVisibility: Visibility = {
  isActive: () => AppState.currentState !== 'background',
  subscribe(onChange) {
    const subscription = AppState.addEventListener('change', (state) => onChange(state !== 'background'));
    return () => subscription.remove();
  },
};
