import { useEffect, type ReactNode } from 'react';
import type { BusArrivalsResponse } from '../../types/domain';
import type { ServiceDirection, StopReference } from '../../types/busService';
import { operatorName } from '../../shared/utils/operators';
import { useBusServiceDetails } from './useBusServiceDetails';
import { collectDeckTypes, formatFrequency, formatHours, summarizeDeckTypes } from './serviceDetails';

interface ServiceSheetProps {
  serviceNo: string;
  arrivals: BusArrivalsResponse | null;
  onClose: () => void;
}

// A bottom sheet for one bus service. Opened from the service number on the board.
export function ServiceSheet({ serviceNo, arrivals, onClose }: ServiceSheetProps) {
  const { details, loading, failed } = useBusServiceDetails(serviceNo);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const deckSummary = summarizeDeckTypes(collectDeckTypes(arrivals, serviceNo));

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sheet-head">
          <h2 id="sheet-title" className="sheet-title">
            <span className="service-badge">{serviceNo}</span>
            Service details
          </h2>
          <button type="button" className="btn btn-quiet" onClick={onClose} aria-label="Close bus details">
            Close
          </button>
        </header>

        {loading && <p className="caption">Loading bus details…</p>}
        {failed && <p className="error" role="alert">Bus details are not available right now.</p>}

        {details && (
          <>
            <p className="sheet-meta">
              {details.operators.map(operatorName).join(', ')}
              {' · '}Deck: {deckSummary}
            </p>
            {details.directions.map((direction) => (
              <DirectionBlock key={direction.direction} direction={direction} />
            ))}
            <p className="caption">
              Weekday frequency only. LTA does not publish a weekend frequency. Deck type comes from the buses due at this stop now.
            </p>
          </>
        )}
      </section>
    </div>
  );
}

function DirectionBlock({ direction }: { direction: ServiceDirection }) {
  return (
    <div className="sheet-block">
      <p className="label">{direction.isLoop ? 'Loop route' : `Direction ${direction.direction}`}</p>
      <p className="sheet-route">{routeText(direction)}</p>
      <p className="caption">
        {direction.stopCount} stops · {direction.category.toLowerCase()} service
      </p>

      <Row label="Weekday">{formatHours(direction.hours.weekday)}</Row>
      <Row label="Saturday">{formatHours(direction.hours.saturday)}</Row>
      <Row label="Sunday">{formatHours(direction.hours.sunday)}</Row>

      <Row label="Morning peak">{formatFrequency(direction.frequency.amPeak)}</Row>
      <Row label="Morning off-peak">{formatFrequency(direction.frequency.amOffPeak)}</Row>
      <Row label="Evening peak">{formatFrequency(direction.frequency.pmPeak)}</Row>
      <Row label="Evening off-peak">{formatFrequency(direction.frequency.pmOffPeak)}</Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="sheet-row">
      <span className="caption">{label}</span>
      <span>{children}</span>
    </div>
  );
}

function routeText(direction: ServiceDirection): string {
  if (direction.isLoop) {
    return `Loops from ${stopName(direction.origin)}${direction.loopDescription ? ` via ${direction.loopDescription}` : ''}`;
  }
  return `${stopName(direction.origin)} to ${stopName(direction.destination)}`;
}

function stopName(stop: StopReference | null): string {
  return stop === null ? 'unknown stop' : stop.description;
}
