import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSearchQueryStore } from '../src/features/search/searchQueryStore';

test('the query is kept until it is cleared', () => {
  const store = createSearchQueryStore();
  assert.equal(store.getState().query, '');
  store.getState().setQuery('Victoria');
  assert.equal(store.getState().query, 'Victoria');
  store.getState().setQuery('');
  assert.equal(store.getState().query, '');
});
