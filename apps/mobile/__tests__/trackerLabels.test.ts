import assert from 'node:assert/strict';
import { test } from 'node:test';
import { crowdLevelOf, deckTypeOf, statusMessage, stopsAwayLabel } from '../src/features/route-tracker/trackerLabels';

test('stopsAwayLabel says Arriving when the bus is at the stop', () => {
  assert.equal(stopsAwayLabel(0, '6 min'), 'Arriving');
});

test('stopsAwayLabel says Arriving when the ETA is under a minute, even without a stop count', () => {
  assert.equal(stopsAwayLabel(3, 'Arr'), 'Arriving');
  assert.equal(stopsAwayLabel(null, 'Arr'), 'Arriving');
});

test('stopsAwayLabel uses the singular for one stop', () => {
  assert.equal(stopsAwayLabel(1, '2 min'), '1 stop away');
});

test('stopsAwayLabel uses the plural for several stops', () => {
  assert.equal(stopsAwayLabel(4, '6 min'), '4 stops away');
});

test('stopsAwayLabel gives no count when the position is unknown', () => {
  assert.equal(stopsAwayLabel(null, '6 min'), null);
});

test('statusMessage has nothing to say while the bus is tracked live', () => {
  assert.equal(statusMessage('live'), null);
});

test('statusMessage names the three cases where there is no live position', () => {
  assert.equal(statusMessage('scheduled')?.title, 'Scheduled');
  assert.equal(statusMessage('noEstimate')?.title, 'No Est. Available');
  assert.equal(statusMessage('notInOperation')?.title, 'Not In Operation');
});

test('maps the load code to a crowd level', () => {
  assert.deepEqual([crowdLevelOf('SEA'), crowdLevelOf('SDA'), crowdLevelOf('LSD')], [0, 1, 2]);
});

test('maps the deck code to a bus type', () => {
  assert.deepEqual([deckTypeOf('SD'), deckTypeOf('DD'), deckTypeOf('BD')], [0, 1, 2]);
});
