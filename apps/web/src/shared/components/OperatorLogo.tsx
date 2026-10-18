import { useState } from 'react';
import { operatorName } from '../utils/operators';

// Logo files live in apps/web/public/operators/. Until a file exists, the operator code shows as text.
const LOGOS: Record<string, string> = {
  GAS: '/operators/go-ahead.svg',
  SBST: '/operators/sbs-transit.svg',
  SMRT: '/operators/smrt.svg',
  TIBS: '/operators/tower-transit.svg',
};

interface OperatorLogoProps {
  operator: string;
}

export function OperatorLogo({ operator }: OperatorLogoProps) {
  const [failed, setFailed] = useState(false);
  const logo = LOGOS[operator];

  if (logo === undefined || failed) {
    return <span className="service-operator">{operator}</span>;
  }

  return (
    <img
      className="service-operator-logo"
      src={logo}
      alt={operatorName(operator)}
      title={operatorName(operator)}
      onError={() => setFailed(true)}
    />
  );
}
