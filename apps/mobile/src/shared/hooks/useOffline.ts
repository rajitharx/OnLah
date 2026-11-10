import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { isOffline } from '../utils/connectivity';

// True once the device reports no connection or no reachable internet. Unknown counts as online.
export function useOffline(): boolean {
  const [offline, setOffline] = useState(false);

  useEffect(() => NetInfo.addEventListener((state) => setOffline(isOffline(state))), []);

  return offline;
}
