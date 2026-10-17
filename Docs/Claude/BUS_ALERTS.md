# Bus alerts (advisories)

Status: web built. Mobile parked (KIV). Last updated 2026-10-18.

## What it is

A bus advisory is an inline notice on a stop board. It says when the arrivals data has a gap:

- **Stop quiet.** The stop returns no services at all.
- **Service has no buses due.** A service in the response has no next bus, no second bus, and no third bus.

The advisory describes missing data. It does not claim a cause. The app cannot tell whether a bus is out of service, the stop is outside operating hours, or LTA is down.

## Why it is not an LTA disruption feed

LTA DataMall publishes a train disruption feed (`TrainServiceAlerts`). The LTA reference in this repo lists no bus disruption feed. The v1 scope asks only for MRT alerts, and for nearby bus arrivals as a fallback. So bus advisories come from the arrivals response we already fetch.

The app guide asks for the same thing: "Advisory message shown when no data returned" under Bus Arrivals.

## Rules (web)

Defined in `apps/web/src/features/arrivals/busAdvisories.ts`. Unit tests are in `busAdvisories.test.ts`.

| Input | Output |
|---|---|
| No services | `stop-quiet` advisory |
| Service with `nextBus`, `nextBus2`, and `nextBus3` all null | `service-no-buses` advisory, with the service number |
| Service with any later bus present | No advisory for that service |
| All services have buses due | No advisories |

Advisories keep the order of the response.

## Where it shows (web)

`StopBoard` renders advisories under the freshness line, above "Next departures". The style is `.advisory` in `apps/web/src/app/styles.css`. It is quieter than the MRT banner, and it is never a modal.

## Mobile (KIV)

Not built. Mobile would reuse the same rules. The logic is a pure function on the same response shape, so the port is small. Mobile work also needs a component under `apps/mobile/src/features/arrivals/`, following the mobile UI skill (`.claude/commands/ui.md`).

## Open questions

1. **Operating hours.** The guide suggests checking Bus Routes operating hours to show "Not In Operation" versus "Data unavailable". That needs a `BusRoutes` lookup on the backend, which does not exist yet.
2. **Push notifications.** The v1 scope says push a notification when a disruption is detected. Nothing sends one, on either platform. This applies to MRT alerts too.
3. **Bus disruption source.** If LTA or another source publishes bus disruptions, the advisory rules would need a new input. We have not found one.

## How to check it

- Unit tests: `cd apps/web && npm test`.
- Browser: stop-level and service-level advisories were checked in headless Chrome by intercepting `GET /api/v1/bus-arrivals` and returning modified data. Live data had no empty service in the 60 stops scanned on 2026-10-18, so the live path was not exercised.
