# Bus service details popup

Status: backend and web built. Mobile parked (KIV). Last updated 2026-10-18.

## What it does

Tapping a service number on a stop board opens a bottom sheet with the details of that service:

- Operator and the deck types seen at this stop now (single deck, double deck, or both).
- Each direction, with its route from origin to destination. Loop services show the loop point.
- Stop count and category (trunk, feeder, and so on).
- Operating hours for weekday, Saturday, and Sunday, from the origin stop.
- Peak and off-peak frequency, as LTA publishes it, for weekday mornings and evenings.

## What LTA does not publish

- **Weekend frequency.** LTA publishes peak and off-peak frequency for weekdays only. The popup says so.
- **Deck type per service.** The static bus data has no deck type. The popup summarises the deck types of the buses due at this stop now, from the live arrivals. It does not show the deck types a service runs in general.

## Data sources

| Popup field | Source | Stored in |
|---|---|---|
| Operator, category, origin and destination codes, loop point, frequency | LTA `BusServices` | `BusServices` table |
| Stop count, hours by day | LTA `BusRoutes`, origin stop (sequence 1) | `BusRoutes` table |
| Stop names | `BusStops` table (already synced) | `BusStops` table |
| Deck types | Live `bus-arrivals` response for the same stop | Not stored |

`BusServices` and `BusRoutes` are reference data. They are loaded by `POST /api/v1/admin/bus-network/sync` with the `X-Admin-Key` header. Run it again when LTA changes routes. The last sync loaded 800 services and 26,833 stop rows.

## Backend

- `GET /api/v1/bus-services/{serviceNo}`. Returns 404 when the service is unknown, and 422 when the number has characters other than letters and digits. The service number is upper-cased before lookup.
- Hours are `HH:mm`. LTA times that are not four digits, such as `-` or empty, come back as `null`.
- Frequency is returned as LTA sends it, such as `9-11`. The web formats it.
- Code: `apps/backend/src/OnLah.Application/BusServices/`, `OnLah.Domain/BusNetwork/`, `OnLah.Infrastructure/Lta/LtaBusNetworkClient.cs`, `OnLah.Api/Endpoints/BusServices/`.
- Tests: `GetBusServiceDetailsServiceTests`, `BusNetworkSyncServiceTests`, `LtaBusNetworkClientTests`, and `BusServiceEndpointTests`.

## Web

- The service number is a button on each service row. It opens `ServiceSheet`.
- Closes with the Close button, a tap on the backdrop, or Escape.
- Formatting rules are in `apps/web/src/features/services/serviceDetails.ts`, with unit tests.

## Mobile (KIV)

Not built. The popup is a web bottom sheet. Mobile would need the same endpoint and formatting rules. The formatting is pure, so it ports directly. The UI would follow `.claude/commands/ui.md`, and a native bottom sheet would be a new component under `apps/mobile/src/features/arrivals/`.

## Open questions

1. **Direction 2 hours for some services.** Service 12 direction 2 shows "Not published" for every day. This is what LTA sends for its origin stop. Confirm with LTA if the gap matters.
2. **Freshness of reference data.** The sync is manual. A weekly job would keep it current. Not decided.
3. **Deck type per service.** Would need a source outside LTA DataMall, or a log of live deck types. Not decided.
