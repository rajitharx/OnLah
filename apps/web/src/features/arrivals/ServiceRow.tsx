import type { BusArrival } from '../../types/domain';
import { OperatorLogo } from '../../shared/components/OperatorLogo';
import { EtaTile } from './EtaTile';

interface ServiceRowProps {
  service: BusArrival;
  now: number;
}

export function ServiceRow({ service, now }: ServiceRowProps) {
  const timings = [service.nextBus, service.nextBus2, service.nextBus3];

  return (
    <li className="service-row">
      <div className="service-head">
        <span className="service-badge">{service.serviceNo}</span>
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
