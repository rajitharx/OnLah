import type { BusType, CrowdLevel } from '../../types/domain';

const crowdLabels: Record<CrowdLevel, string> = { 0: 'Seats', 1: 'Standing', 2: 'Crowded' };
const crowdClasses: Record<CrowdLevel, string> = {
  0: 'crowd-seats',
  1: 'crowd-standing',
  2: 'crowd-crowded',
};
const busTypeLabels: Record<BusType, string> = { 0: 'SD', 1: 'DD', 2: 'BD' };

export function crowdLabel(level: CrowdLevel): string {
  return crowdLabels[level];
}

export function crowdClass(level: CrowdLevel): string {
  return crowdClasses[level];
}

export function busTypeLabel(type: BusType): string {
  return busTypeLabels[type];
}

export function minutesUntil(iso: string, now: number): number {
  return Math.max(0, Math.round((Date.parse(iso) - now) / 60_000));
}

export function secondsSince(iso: string, now: number): number {
  return Math.max(0, Math.floor((now - Date.parse(iso)) / 1_000));
}

const busTypeNames: Record<BusType, string> = { 0: 'single deck', 1: 'double deck', 2: 'bendy' };

export function busTypeName(type: BusType): string {
  return busTypeNames[type];
}
