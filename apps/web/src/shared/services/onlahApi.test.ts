import { describe, expect, it } from 'vitest';
import { createServerClock } from './serverClock';
import { ApiError, createOnlahApi, type FetchLike } from './onlahApi';

const BASE = 'http://api.test';

function fakeFetch(respond: () => Response, calls: string[] = []): FetchLike {
  return async (url) => {
    calls.push(url);
    return respond();
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('createOnlahApi', () => {
  it('anchors the server clock to fetchedAt, not the device clock', async () => {
    const deviceNow = Date.parse('2030-01-01T00:00:00Z');
    const clock = createServerClock(() => 0, () => deviceNow);
    const api = createOnlahApi(
      BASE,
      fakeFetch(() => json({ stopCode: '01012', fetchedAt: '2026-10-19T10:00:00Z', services: [] })),
      clock,
    );

    await api.getArrivals('01012');

    expect(clock.now()).toBe(Date.parse('2026-10-19T10:00:00Z'));
  });

  it('getArrivals encodes the stop code in the query string', async () => {
    const calls: string[] = [];
    const api = createOnlahApi(BASE, fakeFetch(() => json({ stopCode: '01012', fetchedAt: '', services: [] }), calls));

    await api.getArrivals('01012');

    expect(calls).toEqual([`${BASE}/api/v1/bus-arrivals?stopCode=01012`]);
  });

  it('getArrivals turns a non-2xx response into ApiError with the problem detail', async () => {
    const api = createOnlahApi(BASE, fakeFetch(() => json({ detail: 'LTA DataMall is unreachable.' }, 502)));

    const error = await api.getArrivals('01012').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(502);
    expect((error as ApiError).message).toBe('LTA DataMall is unreachable.');
  });

  it('getArrivals falls back to a status message when the body is not JSON', async () => {
    const api = createOnlahApi(BASE, fakeFetch(() => new Response('<html>', { status: 500 })));

    const error = await api.getArrivals('01012').catch((e: unknown) => e);

    expect((error as ApiError).message).toBe('Request failed with status 500.');
  });

  it('getArrivals lets network failures reject without wrapping them as ApiError', async () => {
    const api = createOnlahApi(BASE, async () => {
      throw new TypeError('Failed to fetch');
    });

    const error = await api.getArrivals('01012').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TypeError);
    expect(error).not.toBeInstanceOf(ApiError);
  });

  it('searchBusStops encodes the query', async () => {
    const calls: string[] = [];
    const api = createOnlahApi(BASE, fakeFetch(() => json([]), calls));

    await api.searchBusStops('Victoria St');

    expect(calls).toEqual([`${BASE}/api/v1/bus-stops/search?query=Victoria%20St`]);
  });

  it('getNearbyStops sends coordinates and radius', async () => {
    const calls: string[] = [];
    const api = createOnlahApi(BASE, fakeFetch(() => json([]), calls));

    await api.getNearbyStops(1.2841, 103.8513, 5000);

    expect(calls).toEqual([`${BASE}/api/v1/bus-stops/nearby?lat=1.2841&lng=103.8513&radiusMeters=5000`]);
  });

  it('getBusService requests the service by number, encoded in the path', async () => {
    const calls: string[] = [];
    const api = createOnlahApi(BASE, fakeFetch(() => json({ serviceNo: '102M', operators: [], directions: [] }), calls));

    await api.getBusService('102M');

    expect(calls).toEqual([`${BASE}/api/v1/bus-services/102M`]);
  });

  it('getTrainAlerts returns the parsed body', async () => {
    const body = { data: { status: 1, alerts: [] }, fetchedAt: '2026-10-17T10:00:00Z' };
    const api = createOnlahApi(BASE, fakeFetch(() => json(body)));

    expect(await api.getTrainAlerts()).toEqual(body);
  });

  it('getRouteTracker sends the stop and service, and encodes the service number', async () => {
    const calls: string[] = [];
    const api = createOnlahApi(BASE, fakeFetch(() => json({ serviceNo: '10e' }), calls));

    await api.getRouteTracker('67009', '10e');

    expect(calls).toEqual([`${BASE}/api/v1/route-tracker?busStopCode=67009&serviceNo=10e`]);
  });

  it('getRouteTracker sends the destination code when given', async () => {
    const calls: string[] = [];
    const api = createOnlahApi(BASE, fakeFetch(() => json({ serviceNo: '136' }), calls));

    await api.getRouteTracker('66271', '136', undefined, '11111');

    expect(calls).toEqual([`${BASE}/api/v1/route-tracker?busStopCode=66271&serviceNo=136&destinationCode=11111`]);
  });

  it('getRouteTracker reports an unknown stop or service as an ApiError with status 404', async () => {
    const api = createOnlahApi(BASE, fakeFetch(() => json({ detail: 'BusService was not found.' }, 404)));

    const error = await api.getRouteTracker('67009', '999').catch((e: unknown) => e);

    expect((error as ApiError).status).toBe(404);
  });
});
