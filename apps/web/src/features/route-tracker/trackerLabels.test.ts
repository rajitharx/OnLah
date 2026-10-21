import { describe, expect, it } from 'vitest';
import { crowdLevelOf, deckTypeOf, statusMessage, stopsAwayLabel } from './trackerLabels';

describe('stopsAwayLabel', () => {
  it('says Arriving when the bus is at the stop', () => {
    expect(stopsAwayLabel(0, '6 min')).toBe('Arriving');
  });

  it('says Arriving when the ETA is under a minute, even without a stop count', () => {
    expect(stopsAwayLabel(3, 'Arr')).toBe('Arriving');
    expect(stopsAwayLabel(null, 'Arr')).toBe('Arriving');
  });

  it('uses the singular for one stop', () => {
    expect(stopsAwayLabel(1, '2 min')).toBe('1 stop away');
  });

  it('uses the plural for several stops', () => {
    expect(stopsAwayLabel(4, '6 min')).toBe('4 stops away');
  });

  it('gives no count when the position is unknown, so no wrong number is shown', () => {
    expect(stopsAwayLabel(null, '6 min')).toBeNull();
  });
});

describe('statusMessage', () => {
  it('has nothing to say while the bus is tracked live', () => {
    expect(statusMessage('live')).toBeNull();
  });

  it('names the three cases where there is no live position', () => {
    expect(statusMessage('scheduled')?.title).toBe('Scheduled');
    expect(statusMessage('noEstimate')?.title).toBe('No Est. Available');
    expect(statusMessage('notInOperation')?.title).toBe('Not In Operation');
  });
});

describe('LTA codes', () => {
  it('maps the load code to a crowd level', () => {
    expect([crowdLevelOf('SEA'), crowdLevelOf('SDA'), crowdLevelOf('LSD')]).toEqual([0, 1, 2]);
  });

  it('maps the deck code to a bus type', () => {
    expect([deckTypeOf('SD'), deckTypeOf('DD'), deckTypeOf('BD')]).toEqual([0, 1, 2]);
  });
});
