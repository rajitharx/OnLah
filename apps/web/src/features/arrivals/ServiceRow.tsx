import type { BusArrival } from '../../types/domain';
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
        <span className="service-operator">{service.operator}</span>
      </div>
      <div className="eta-grid">
        {timings.map((timing, index) => (
          <EtaTile key={index} timing={timing} now={now} />
        ))}
      </div>
    </li>
  );
}
