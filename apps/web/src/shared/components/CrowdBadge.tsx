import type { CrowdLevel } from '../../types/domain';
import { crowdClass, crowdLabel } from '../utils/arrival';

export function CrowdBadge({ level }: { level: CrowdLevel }) {
  return (
    <span className={`crowd-badge ${crowdClass(level)}`}>
      <span className="crowd-bar" aria-hidden="true" />
      <span>{crowdLabel(level)}</span>
    </span>
  );
}
