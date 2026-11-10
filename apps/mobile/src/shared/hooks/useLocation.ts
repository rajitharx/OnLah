import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { locateOnce, type LocationApi } from '../services/locate';
import type { LocationFailure } from '../../features/nearby/locationMessages';

const expoLocation: LocationApi = {
  requestPermission: async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === Location.PermissionStatus.GRANTED ? 'granted' : 'denied';
  },
  getPosition: async () => {
    const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: coords.latitude, longitude: coords.longitude };
  },
};

export interface Origin {
  latitude: number;
  longitude: number;
}

interface LocationState {
  origin: Origin | null;
  locating: boolean;
  failure: LocationFailure | null;
  // Asks for permission if needed, then finds the phone. Nothing is located until this is called.
  locate: () => Promise<void>;
}

// A result that arrives after the screen has gone is dropped, so it never sets state on an unmounted screen.
export function useLocation(): LocationState {
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [locating, setLocating] = useState(false);
  const [failure, setFailure] = useState<LocationFailure | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const locate = useCallback(async () => {
    setLocating(true);
    setFailure(null);
    const result = await locateOnce(expoLocation);
    if (!mounted.current) return;
    if (result.kind === 'ok') setOrigin({ latitude: result.latitude, longitude: result.longitude });
    else setFailure(result.failure);
    setLocating(false);
  }, []);

  return { origin, locating, failure, locate };
}
