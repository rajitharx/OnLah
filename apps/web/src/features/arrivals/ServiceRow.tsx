import type { BusArrival } from '../../types/domain';
import { OperatorLogo } from '../../shared/components/OperatorLogo';
import { EtaTile } from './EtaTile';

interface ServiceRowProps {
  service: BusArrival;
  now: number;
  onOpenService: (serviceNo: string) => void;
}

export function ServiceRow({ service, now, onOpenService }: ServiceRowProps) {
  const timings = [service.nextBus, service.nextBus2, service.nextBus3];

  return (
    <li className="service-row">
      <div className="service-head">
        <button
          type="button"
          className="service-badge service-badge-button"
          onClick={() => onOpenService(service.serviceNo)}
          aria-label={`Bus ${service.serviceNo} details`}
        >
          {service.serviceNo}
        </button>
        <OperatorLogo operator={service.operator} />
      </div>
      <div className="eta-grid">
        {timings.map((timing, index) => (
          <EtaTile key={index} timing={timing} now={now} />
        ))}
      </div>
    </li>
  );
}
