import assert from 'node:assert/strict';
import { test } from 'node:test';
import { disruptionAnnouncement } from '../src/features/disruptions/announcement';

test('says nothing while the banner is not showing', () => {
  assert.equal(disruptionAnnouncement(false, 'NSL', 'Delay', null), null);
});

test('announces the line and the message when the banner appears', () => {
  assert.equal(disruptionAnnouncement(true, 'NSL', 'Delay between Bishan and Ang Mo Kio', null), 'NSL disruption. Delay between Bishan and Ang Mo Kio');
});

test('names the line only, or Train, when there is no message or line', () => {
  assert.equal(disruptionAnnouncement(true, 'EWL', undefined, null), 'EWL disruption');
  assert.equal(disruptionAnnouncement(true, undefined, undefined, null), 'Train disruption');
});

test('does not repeat the same words', () => {
  const first = disruptionAnnouncement(true, 'NSL', 'Delay', null);
  assert.equal(disruptionAnnouncement(true, 'NSL', 'Delay', first), null);
});

test('announces again when the alert changes while the banner stays up', () => {
  const first = disruptionAnnouncement(true, 'NSL', 'Delay', null);
  assert.equal(disruptionAnnouncement(true, 'EWL', 'Fault', first), 'EWL disruption. Fault');
});
