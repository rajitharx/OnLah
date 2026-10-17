import { useMemo, useState } from 'react';
import { sampleStops } from '../../shared/services/sampleData';
import { haversineMeters, type LatLng } from '../../shared/utils/geo';
import { EmptyState } from '../../shared/components/EmptyState';
import { PinIcon } from '../../shared/components/Icons';
import { StopCard } from '../../shared/components/StopCard';

const RADIUS_M = 5_000;
// Raffles Place. Used until the visitor shares their location.
const SAMPLE_LOCATION: LatLng = { latitude: 1.2841, longitude: 103.8513 };

interface NearbyViewProps {
  onOpen: (stopCode: string) => void;
}

export function NearbyView({ onOpen }: NearbyViewProps) {
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const center = origin ?? SAMPLE_LOCATION;

  const nearby = useMemo(
    () =>
      sampleStops
        .map((s) => ({ stop: s, distanceMeters: haversineMeters(center, s) }))
        .filter((x) => x.distanceMeters <= RADIUS_M)
        .sort((a, b) => a.distanceMeters - b.distanceMeters),
    [center],
  );

  const locate = (): void => {
    if (!navigator.geolocation) {
      setError('Location is not available in this browser.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError('Location was not shared. Showing the sample location instead.');
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
          {origin ? `Within 5 km of you` : 'Sample location: Raffles Place'}
        </span>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {nearby.length === 0 ? (
        <EmptyState icon={<PinIcon size={24} />} message="No stops within 5 km." />
      ) : (
        <div className="stop-list">
          {nearby.map(({ stop, distanceMeters }) => (
            <StopCard key={stop.busStopCode} stop={stop} distanceMeters={distanceMeters} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  );
}
