import { useEffect, useRef, type ReactNode, type TouchEvent } from 'react';
import type { BusArrivalsResponse } from '../../types/domain';
import type { ServiceDirection, StopReference } from '../../types/busService';
import { operatorName } from '../../shared/utils/operators';
import { useBusServiceDetails } from './useBusServiceDetails';
import { collectDeckTypes, frequencyRows, hoursRows, summarizeDeckTypes } from './serviceDetails';
import { isSwipeDismiss } from './sheetGesture';

interface ServiceSheetProps {
  serviceNo: string;
  arrivals: BusArrivalsResponse | null;
  onClose: () => void;
}

// A bottom sheet for one bus service. Opened from the service number on the board.
export function ServiceSheet({ serviceNo, arrivals, onClose }: ServiceSheetProps) {
  const { details, loading, failed } = useBusServiceDetails(serviceNo);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const deckSummary = summarizeDeckTypes(collectDeckTypes(arrivals, serviceNo));

  const onTouchStart = (event: TouchEvent<HTMLElement>): void => {
    touchStartY.current = event.touches[0]?.clientY ?? null;
  };
  const onTouchEnd = (event: TouchEvent<HTMLElement>): void => {
    const startY = touchStartY.current;
    touchStartY.current = null;
    const endY = event.changedTouches[0]?.clientY;
    if (startY !== null && endY !== undefined && isSwipeDismiss(startY, endY)) onClose();
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sheet-head" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <span className="sheet-handle" aria-hidden="true" />
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
              {' · '}Deck (buses due now): {deckSummary}
            </p>
            {details.directions.map((direction) => (
              <DirectionBlock key={direction.direction} direction={direction} />
            ))}
          </>
        )}
      </section>
    </div>
  );
}

function DirectionBlock({ direction }: { direction: ServiceDirection }) {
  const hours = hoursRows(direction.hours);
  const frequency = frequencyRows(direction.frequency);

  return (
    <div className="sheet-block">
      <p className="label">{direction.isLoop ? 'Loop route' : `Direction ${direction.direction}`}</p>
      <p className="sheet-route">{routeText(direction)}</p>
      <p className="caption">
        {direction.stopCount} stops · {direction.category.toLowerCase()} service
      </p>

      {hours.map((row) => (
        <SheetRow key={row.label} label={row.label}>{row.value}</SheetRow>
      ))}

      {frequency.length > 0 && <p className="label sheet-subhead">Weekday frequency</p>}
      {frequency.map((row) => (
        <SheetRow key={row.label} label={row.label}>{row.value}</SheetRow>
      ))}
    </div>
  );
}

function SheetRow({ label, children }: { label: string; children: ReactNode }) {
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
