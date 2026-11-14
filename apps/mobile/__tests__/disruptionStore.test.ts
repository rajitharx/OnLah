import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { useDisruptionStore } from '../src/shared/stores/disruptionStore';
import { TrainAlertDetail } from '../src/types/domain';

const alert: TrainAlertDetail = {
  line: 'NSL',
  direction: 'Towards Jurong East',
  stations: ['Bishan', 'Ang Mo Kio'],
  message: 'Delay',
  createdAt: '2026-11-14T00:30:00.000Z',
};

beforeEach(() => {
  useDisruptionStore.setState({ status: 0, alerts: [], fetchedAt: null, dismissedAt: null, hasError: false });
});

test('setAlerts stores the result and clears an earlier error and dismissal', () => {
  useDisruptionStore.setState({ hasError: true, dismissedAt: '2026-11-14T00:00:00.000Z' });
  useDisruptionStore.getState().setAlerts(1, [alert], '2026-11-14T01:00:00.000Z');
  const state = useDisruptionStore.getState();
  assert.equal(state.status, 1);
  assert.deepEqual(state.alerts, [alert]);
  assert.equal(state.fetchedAt, '2026-11-14T01:00:00.000Z');
  assert.equal(state.hasError, false);
  assert.equal(state.dismissedAt, null);
});

test('setError keeps the last good alerts but flags them as not current', () => {
  useDisruptionStore.getState().setAlerts(1, [alert], '2026-11-14T01:00:00.000Z');
  useDisruptionStore.getState().setError();
  const state = useDisruptionStore.getState();
  assert.equal(state.hasError, true);
  assert.equal(state.status, 1);
  assert.deepEqual(state.alerts, [alert]);
});

test('dismiss records the time, and a fresh result brings the banner back', () => {
  useDisruptionStore.getState().dismiss();
  assert.notEqual(useDisruptionStore.getState().dismissedAt, null);
  useDisruptionStore.getState().setAlerts(1, [alert], '2026-11-14T02:00:00.000Z');
  assert.equal(useDisruptionStore.getState().dismissedAt, null);
});
