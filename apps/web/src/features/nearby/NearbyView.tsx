import { useState } from 'react';
import type { BusStop } from '../../types/domain';
import type { LatLng } from '../../shared/utils/geo';
import { sortByDistance } from '../../shared/utils/geo';
import { EmptyState } from '../../shared/components/EmptyState';
import { PinIcon, SearchIcon } from '../../shared/components/Icons';
import { StopCard } from '../../shared/components/StopCard';
import { NEARBY_RADIUS_M, useNearbyStops } from './useNearbyStops';
import { locationErrorMessage } from './locationMessages';

interface NearbyViewProps {
  onOpen: (stop: BusStop) => void;
  onNavigate: (view: 'search') => void;
}

const RADIUS_KM = NEARBY_RADIUS_M / 1000;

export function NearbyView({ onOpen, onNavigate }: NearbyViewProps) {
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { stops, loading, failed } = useNearbyStops(origin, attempt);
  const nearest = sortByDistance(stops);

  const locate = (): void => {
    if (!navigator.geolocation) {
      setLocationError('Location is not available in this browser. Search for a stop instead.');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setAttempt((n) => n + 1);
        setLocating(false);
      },
      (error) => {
        setLocationError(locationErrorMessage(error.code));
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
        {origin !== null && <span className="caption">Stops within {RADIUS_KM} km of you</span>}
      </div>
      {origin === null && (
        <p className="caption">
          Your location is used only to find stops near you. It is not saved on this device.
        </p>
      )}

      {locationError && (
        <div className="nearby-error">
          <p className="error" role="alert">{locationError}</p>
          <button type="button" className="btn" onClick={() => onNavigate('search')}>
            <SearchIcon size={14} />
            Search stops
          </button>
        </div>
      )}
      {failed && (
        <div className="nearby-error">
          <p className="error" role="alert">Nearby stops are unavailable right now. Try again.</p>
          <button type="button" className="btn" onClick={() => setAttempt((n) => n + 1)}>Try again</button>
        </div>
      )}

      {origin === null && (
        <EmptyState icon={<PinIcon size={24} />} message="Nearby stops appear once you share your location." />
      )}

      {origin !== null && !loading && !failed && stops.length === 0 && (
        <EmptyState
          icon={<PinIcon size={24} />}
          message={`No stops within ${RADIUS_KM} km. Try Search instead.`}
          action={
            <button type="button" className="btn" onClick={() => onNavigate('search')}>
              <SearchIcon size={14} />
              Search stops
            </button>
          }
        />
      )}

      {nearest.length > 0 && (
        <div className="stop-list">
          {nearest.map((stop) => (
            <StopCard key={stop.busStopCode} stop={stop} distanceMeters={stop.distanceMeters} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  );
}
