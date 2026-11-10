export const OFFLINE_MESSAGE = "You're offline. Saved stops still open. Bus times return when you're back online.";

export interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

// Unknown (null) is not offline: the notice only shows once the device says so.
export function isOffline(state: NetworkState): boolean {
  return state.isConnected === false || state.isInternetReachable === false;
}
