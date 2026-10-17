import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

interface LocationState {
  location: Location.LocationObject | null;
  hasPermission: boolean | null;
  requestPermission: () => Promise<void>;
}

export function useLocation(): LocationState {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === Location.PermissionStatus.GRANTED;
    setHasPermission(granted);
    if (granted) {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(loc);
    }
  }, []);

  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      const granted = status === Location.PermissionStatus.GRANTED;
      setHasPermission(granted);
      if (granted) {
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }).then(setLocation);
      }
    });
  }, []);

  return { location, hasPermission, requestPermission };
}
