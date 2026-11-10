import assert from 'node:assert/strict';
import { test } from 'node:test';
import { OFFLINE_MESSAGE, isOffline } from '../src/shared/utils/connectivity';

test('is online while the network is reachable', () => {
  assert.equal(isOffline({ isConnected: true, isInternetReachable: true }), false);
});

test('is offline when there is no connection', () => {
  assert.equal(isOffline({ isConnected: false, isInternetReachable: null }), true);
});

test('is offline when connected but the internet is unreachable', () => {
  assert.equal(isOffline({ isConnected: true, isInternetReachable: false }), true);
});

test('does not claim offline while the state is still unknown', () => {
  assert.equal(isOffline({ isConnected: null, isInternetReachable: null }), false);
  assert.equal(isOffline({ isConnected: true, isInternetReachable: null }), false);
});

test('uses the web wording', () => {
  assert.equal(OFFLINE_MESSAGE, "You're offline. Saved stops still open. Bus times return when you're back online.");
});
