import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sortByServiceNo } from '../src/shared/utils/serviceNo';

test('sorts service numbers by their number, not as text', () => {
  const services = ['130', '12', '2', '32', '7', '80'].map((serviceNo) => ({ serviceNo }));
  assert.deepEqual(sortByServiceNo(services).map((s) => s.serviceNo), ['2', '7', '12', '32', '80', '130']);
});

test('keeps a suffix after its number, and orders suffixes after the bare number', () => {
  const services = ['961M', '10e', '10', '9'].map((serviceNo) => ({ serviceNo }));
  assert.deepEqual(sortByServiceNo(services).map((s) => s.serviceNo), ['9', '10', '10e', '961M']);
});

test('does not change the order of the input', () => {
  const services = [{ serviceNo: '12' }, { serviceNo: '2' }];
  sortByServiceNo(services);
  assert.deepEqual(services.map((s) => s.serviceNo), ['12', '2']);
});
