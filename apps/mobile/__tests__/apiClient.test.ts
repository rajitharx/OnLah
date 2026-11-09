import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiError, createApiClient } from '../src/shared/services/apiClient';
import { createServerClock } from '../src/shared/utils/serverClock';

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const make = (fetchImpl: typeof fetch, timeoutMs = 1_000) => {
  const clock = createServerClock(() => 1_000_000);
  return { clock, client: createApiClient({ baseUrl: 'http://api.test', fetchImpl, clock, timeoutMs }) };
};

test('get returns the parsed body and calls the base url plus the path', async () => {
  let seen = '';
  const { client } = make(async (url) => {
    seen = String(url);
    return json({ ok: true });
  });
  assert.deepEqual(await client.get('/api/v1/x'), { ok: true });
  assert.equal(seen, 'http://api.test/api/v1/x');
});

test('get syncs the server clock from a body that carries fetchedAt', async () => {
  const { client, clock } = make(async () => json({ fetchedAt: '1970-01-01T00:20:00.000Z' }));
  await client.get('/x');
  assert.equal(clock.now(), 1_200_000);
});

test('get leaves the clock alone when the body has no fetchedAt', async () => {
  const { client, clock } = make(async () => json([{ a: 1 }]));
  await client.get('/x');
  assert.equal(clock.now(), 1_000_000);
});

test('get turns problem details into an ApiError carrying the detail text', async () => {
  const { client } = make(async () => json({ detail: 'Stop not found.' }, 404));
  await assert.rejects(client.get('/x'), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 404);
    assert.equal(error.message, 'Stop not found.');
    return true;
  });
});

test('get falls back to a status message when the error body is not problem details', async () => {
  const { client } = make(async () => new Response('boom', { status: 502 }));
  await assert.rejects(client.get('/x'), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 502);
    assert.equal(error.message, 'Request failed with status 502.');
    return true;
  });
});

test('get rejects with status 0 when the request outlives the timeout', async () => {
  const { client } = make((_url, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
  }), 20);
  await assert.rejects(client.get('/x'), (error: unknown) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 0);
    assert.equal(error.message, 'The request timed out.');
    return true;
  });
});

test('get rethrows the abort when the caller cancels', async () => {
  const caller = new AbortController();
  const { client } = make((_url, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
  }));
  const pending = client.get('/x', caller.signal);
  caller.abort();
  await assert.rejects(pending, (error: unknown) => error instanceof DOMException && error.name === 'AbortError');
});

test('health reports ok with a duration when /health answers', async () => {
  let seen = '';
  const { client } = make(async (url) => {
    seen = String(url);
    return new Response('Healthy', { status: 200 });
  });
  const result = await client.health();
  assert.equal(seen, 'http://api.test/health');
  assert.equal(result.ok, true);
  assert.ok(result.ms >= 0);
});

test('health never rejects: a failed probe is not ok', async () => {
  const { client } = make(async () => {
    throw new TypeError('network down');
  });
  assert.equal((await client.health()).ok, false);
});

test('health reports a non-2xx answer as not ok', async () => {
  const { client } = make(async () => new Response('', { status: 503 }));
  assert.equal((await client.health()).ok, false);
});
