import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { DisruptionBanner } from '../src/features/disruptions/DisruptionBanner';
import { useDisruptionStore } from '../src/shared/stores/disruptionStore';
import { TrainAlertDetail } from '../src/types/domain';

const nsl: TrainAlertDetail = {
  line: 'NSL',
  direction: 'Towards Jurong East',
  stations: ['Bishan', 'Ang Mo Kio'],
  message: 'Delay between Bishan and Ang Mo Kio',
  createdAt: '2026-11-14T00:30:00.000Z',
};
const ewl: TrainAlertDetail = { ...nsl, line: 'EWL', message: 'Signal fault' };

const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => undefined);
const store = () => useDisruptionStore.getState();
// The store change has to run inside an async act, so the banner and its effect settle before the next line.
const update = (change: () => void) => act(async () => { change(); });

beforeEach(() => {
  announce.mockClear();
  useDisruptionStore.setState({ status: 0, alerts: [], fetchedAt: null, dismissedAt: null, hasError: false });
});

test('shows nothing and says nothing when the trains are running normally', async () => {
  await render(<DisruptionBanner />);
  expect(screen.queryByText(/disruption/)).toBeNull();
  expect(announce).not.toHaveBeenCalled();
});

test('shows the banner and announces the line and the message when a disruption appears', async () => {
  await render(<DisruptionBanner />);
  await update(() => store().setAlerts(1, [nsl], '2026-11-14T01:00:00.000Z'));
  expect(screen.getByText('NSL disruption')).toBeTruthy();
  expect(announce).toHaveBeenCalledTimes(1);
  expect(announce).toHaveBeenCalledWith('NSL disruption. Delay between Bishan and Ang Mo Kio');
});

test('does not repeat the announcement when a poll returns the same alert', async () => {
  await render(<DisruptionBanner />);
  await update(() => store().setAlerts(1, [nsl], '2026-11-14T01:00:00.000Z'));
  await update(() => store().setAlerts(1, [{ ...nsl }], '2026-11-14T01:00:20.000Z'));
  expect(announce).toHaveBeenCalledTimes(1);
});

test('announces again when a different alert replaces the first', async () => {
  await render(<DisruptionBanner />);
  await update(() => store().setAlerts(1, [nsl], '2026-11-14T01:00:00.000Z'));
  await update(() => store().setAlerts(1, [ewl], '2026-11-14T01:00:20.000Z'));
  expect(announce).toHaveBeenCalledTimes(2);
  expect(announce).toHaveBeenLastCalledWith('EWL disruption. Signal fault');
});

test('a dismissed banner that comes back with the same words is not announced again', async () => {
  await render(<DisruptionBanner />);
  await update(() => store().setAlerts(1, [nsl], '2026-11-14T01:00:00.000Z'));
  await update(() => store().dismiss());
  expect(screen.queryByText('NSL disruption')).toBeNull();
  await update(() => store().setAlerts(1, [nsl], '2026-11-14T01:00:20.000Z'));
  expect(screen.getByText('NSL disruption')).toBeTruthy();
  expect(announce).toHaveBeenCalledTimes(1);
});

test('a disruption that clears and then returns is announced again', async () => {
  await render(<DisruptionBanner />);
  await update(() => store().setAlerts(1, [nsl], '2026-11-14T01:00:00.000Z'));
  await update(() => store().setAlerts(0, [], '2026-11-14T01:05:00.000Z'));
  expect(screen.queryByText('NSL disruption')).toBeNull();
  await update(() => store().setAlerts(1, [nsl], '2026-11-14T01:10:00.000Z'));
  expect(announce).toHaveBeenCalledTimes(2);
});

test('a failed check says the alerts are unavailable instead of looking all clear', async () => {
  await render(<DisruptionBanner />);
  await update(() => store().setError());
  expect(screen.getByText(/Service alerts unavailable/)).toBeTruthy();
  expect(announce).not.toHaveBeenCalled();
});

test('the dismiss button hides the banner', async () => {
  await render(<DisruptionBanner />);
  await update(() => store().setAlerts(1, [nsl], '2026-11-14T01:00:00.000Z'));
  await fireEvent.press(screen.getByRole('button', { name: 'Dismiss disruption alert' }));
  expect(screen.queryByText('NSL disruption')).toBeNull();
});
