import type { BusType } from '../../types/domain';

const LABELS: Record<BusType, string> = { 0: 'Single', 1: 'Double', 2: 'Bendy' };

export function busTypeLabel(type: BusType): string {
  return LABELS[type];
}
