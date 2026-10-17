import { useState } from 'react';

interface OperatorInfo {
  name: string;
  logo: string;
}

// Logo files live in apps/web/public/operators/. Until a file exists, the operator code shows as text.
const OPERATORS: Record<string, OperatorInfo> = {
  GAS: { name: 'Go-Ahead Singapore', logo: '/operators/go-ahead.svg' },
  SBST: { name: 'SBS Transit', logo: '/operators/sbs-transit.svg' },
  SMRT: { name: 'SMRT Buses', logo: '/operators/smrt.svg' },
  TIBS: { name: 'Tower Transit Singapore', logo: '/operators/tower-transit.svg' },
};

interface OperatorLogoProps {
  operator: string;
}

export function OperatorLogo({ operator }: OperatorLogoProps) {
  const [failed, setFailed] = useState(false);
  const info = OPERATORS[operator];

  if (info === undefined || failed) {
    return <span className="service-operator">{operator}</span>;
  }

  return (
    <img
      className="service-operator-logo"
      src={info.logo}
      alt={info.name}
      title={info.name}
      onError={() => setFailed(true)}
    />
  );
}
