import { useState } from 'react';
import type { BusStop } from '../../types/domain';
import type { LatLng } from '../../shared/utils/geo';
import { EmptyState } from '../../shared/components/EmptyState';
import { PinIcon } from '../../shared/components/Icons';
import { StopCard } from '../../shared/components/StopCard';
import { NEARBY_RADIUS_M, useNearbyStops } from './useNearbyStops';

interface NearbyViewProps {
  onOpen: (stop: BusStop) => void;
}

export function NearbyView({ onOpen }: NearbyViewProps) {
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { stops, loading, failed } = useNearbyStops(origin);

  const locate = (): void => {
    if (!navigator.geolocation) {
      setLocationError('Location is not available in this browser.');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError('Location was not shared. Nearby stops need your location.');
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  };

  return (
    <section className="view" aria-labelledby="nearby-title">
      <h1 id="nearby-title" className="view-title">Nearby stops</h1>
      <div className="nearby-actions">
        <button type="button" className="btn" onClick={locate} disabled={locating}>
          <PinIcon size={14} />
          {locating ? 'Locating…' : 'Use my location'}
        </button>
        <span className="caption">
          {origin ? `Within ${NEARBY_RADIUS_M / 1000} km of you` : 'Share your location to see stops nearby.'}
        </span>
      </div>

      {locationError && <p className="error" role="alert">{locationError}</p>}
      {failed && <p className="error" role="alert">Nearby stops are unavailable right now. Try again.</p>}

      {origin === null && (
        <EmptyState icon={<PinIcon size={24} />} message="Nearby stops appear once you share your location." />
      )}

      {origin !== null && !loading && !failed && stops.length === 0 && (
        <EmptyState icon={<PinIcon size={24} />} message={`No stops within ${NEARBY_RADIUS_M / 1000} km.`} />
      )}

      {stops.length > 0 && (
        <div className="stop-list">
          {stops.map((stop) => (
            <StopCard key={stop.busStopCode} stop={stop} distanceMeters={stop.distanceMeters} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  );
}
