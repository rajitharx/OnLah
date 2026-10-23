# OnLah

A fast, accurate bus timing app for Singapore commuters built on LTA DataMall APIs.

## What is OnLah?

OnLah is built for the **habitual Singapore commuter**, someone who checks bus times several times a day from a fixed set of stops. Unlike feature-heavy transit apps that crash or show wildly inaccurate ETAs, OnLah is focused on **speed, accuracy, and reliability**.

Open the app. Find your stop. See your bus. Three taps, cold launch to answer.

There are two clients:

- **Web bus board** (`apps/web`): a browser board for phones and desktops. This is the client in active development.
- **Mobile app** (`apps/mobile`): the React Native app. Some features are parked for later (see the roadmap).

## Key Features (v1)

| Feature | Description | Status |
|---|---|---|
| Real-time bus arrivals | Live ETAs per service, with wheelchair access and bus type (single or double deck) | Web and mobile |
| Crowd level colours | Each arrival is coloured by seat availability: green seats, amber standing, red crowded | Web |
| Service details popup | Tap a service number for its operator, route, stop count, hours by day, and peak and off-peak frequency | Web |
| Bus advisories | An inline notice when a stop has no services, or a service has no buses due | Web (mobile parked) |
| Operator logos | Logo shown per service, with the operator code as fallback | Web (logo files to be added) |
| Nearby stop discovery | Stops within 5 km of the visitor, sorted by distance | Web and mobile |
| Stop search | Search by stop code or road name | Web and mobile |
| Saved stops | Favourites kept on the device, up to 10 | Web and mobile |
| MRT disruption alerts | Banner when a train service is disrupted, refreshed every 2 minutes | Web and mobile |
| Bus stop sync | Admin-triggered full sync of about 5,000 stops from LTA | Backend |
| Bus network sync | Admin-triggered sync of bus services and routes from LTA | Backend |

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + TypeScript (Expo managed workflow) |
| Web | Vite + React + TypeScript (no UI component library) |
| Navigation | React Navigation v6 (mobile) |
| State | Zustand (mobile) |
| Backend | .NET 10 C# Minimal API |
| Database | PostgreSQL |
| Data Source | LTA DataMall API v3 |

## Monorepo Structure

```
apps/
  mobile/          → React Native app (Expo)
  web/             → Vite + React bus board website
  backend/         → .NET 10 C# API
Docs/
  Claude/          → App guide, LTA API reference, and feature notes
    BUS_ALERTS.md          Bus advisories: rules, placement, and parked mobile work
    BUS_SERVICE_DETAILS.md Service details popup: data sources, endpoint, and limits
.claude/           → Claude Code skills and config
```

## Backend API

Base URL: `http://localhost:5050/api/v1`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/bus-arrivals?stopCode={5-digit}` | Real-time arrivals for a stop |
| GET | `/bus-stops/search?query={2 to 50 chars}` | Stops by code or road name, max 20 |
| GET | `/bus-stops/nearby?lat=&lng=&radiusMeters=` | Nearby stops from local DB |
| GET | `/bus-services/{serviceNo}` | Directions, route, hours by day, and frequency for a service |
| GET | `/train-alerts` | Current MRT disruption alerts |
| POST | `/admin/bus-stops/sync` | Sync all bus stops from LTA (needs `X-Admin-Key`) |
| POST | `/admin/bus-network/sync` | Sync bus services and routes from LTA (needs `X-Admin-Key`) |

## Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- PostgreSQL running locally
- LTA DataMall API key ([register here](https://datamall.lta.gov.sg))
- Node.js 20 or later, for the web app
- [Expo CLI](https://docs.expo.dev/get-started/installation/), for the mobile app

### Backend Setup

Store the two secrets once with `dotnet user-secrets`. Use the colon form here.

```bash
cd apps/backend/src/OnLah.Api
dotnet user-secrets set "Lta:AccountKey" "your-lta-key"
dotnet user-secrets set "Admin:ApiKey" "a-long-random-value"
```

Then start the API from the repository root:

```bash
dotnet run --project apps/backend/src/OnLah.Api --launch-profile http
```

`run.sh` checks for the environment variable `Lta__AccountKey` before it starts the API. Use it only with that variable exported:

```bash
export Lta__AccountKey="your-lta-key"
./apps/backend/run.sh
```

The API will not start without `Lta:AccountKey`. `Admin:ApiKey` is needed only for the admin sync endpoints. Without it, those endpoints reject every request.

See [`apps/backend/COMMANDS.md`](apps/backend/COMMANDS.md) for all available commands.

### Web Setup

The web app reads the backend. It never calls LTA directly.

```bash
cd apps/web
npm install
npm run dev
```

Open http://127.0.0.1:5173/. The backend allows this origin in Development. To point the app at another backend, set `VITE_API_BASE_URL` (default `http://localhost:5050`).

To open the board from a phone on the same Wi-Fi, bind the dev server to the network and point the API address at your Mac:

```bash
VITE_API_BASE_URL=http://<your-mac-ip>:5050 npm run dev -- --host
```

The backend must also allow that origin in `appsettings.Development.json`. iOS Safari only gives location to HTTPS pages, so Nearby needs HTTPS on a phone.

### Load the Bus Network

The service details popup needs the bus services and routes. Load them once, and again when LTA changes routes:

```bash
curl -X POST http://localhost:5050/api/v1/admin/bus-network/sync -H "X-Admin-Key: <your Admin:ApiKey>"
```

Load the stops the same way with `POST /api/v1/admin/bus-stops/sync`.

## Testing

```bash
# Backend: unit and integration tests (integration needs Docker for Testcontainers)
dotnet test apps/backend/OnLah.sln

# Web: unit tests and a type check plus production build
cd apps/web
npm test
npm run build
```

## Out of Scope (v1)

- Live bus position on map
- Full disruption rerouting
- Multi-modal journey planning
- Account creation / server-synced favourites
- Android (iOS first; Android in v2)
- Deck type per service from the static data (LTA does not publish it; the popup shows the deck types of the buses due now)

## Roadmap

### v1 (Current)
- Web bus board with arrivals, crowd colours, service details, bus advisories, search, nearby, and saved stops
- MRT disruption banner on web and mobile
- React Native mobile app
- .NET 10 backend + PostgreSQL

### Parked
- Bus advisories and service details on mobile (rules are documented in `Docs/Claude/BUS_ALERTS.md` and `Docs/Claude/BUS_SERVICE_DETAILS.md`)
- Push notifications for MRT alerts (no client sends them yet)

### v2 (Planned)
- Full disruption rerouting with step-by-step navigation
- ETA reliability scoring
- Server-synced favourites

## Release Notes

Newest first. The number after each item is its pull request. The web header shows the version as "Beta x.y", and the version rises by 0.1 on every commit. [`apps/web/CHANGELOG.md`](apps/web/CHANGELOG.md) has more detail on milestone versions.

### 23 October 2026 (Beta 1.8)

- **Better stop search** (#17). Search now matches road names as well as stop names, so "Victoria" finds the stops on Victoria St. Each word in the query must match, so "Orchard Rd" works. Both LTA spellings match, so "Bukit Timah" finds "Bt Timah", and the same goes for Road and Rd, Street and St, Avenue and Ave, Jalan and Jln, and other common LTA abbreviations. Part of a stop code also works, so "1012" finds 01012. When the list stops at 20 results, the page says so.

### 21 October 2026

- **Last bus tag** (#16, Beta 1.5). The ETA tile for the last bus of a service at a stop shows a "LAST" tag with a slowly pulsing dot, on the board and on saved buses. Screen readers hear "last bus". LTA sends no last-bus flag, so the backend compares each ETA with the published last-bus time at that stop. It is an estimate.
- **Route Tracker** (#14, Beta 1.1). Follow one bus service at one stop. It shows a "N stops away" countdown, the ETA and crowd level, the later buses, and a rail of every stop. Open it from the Track link on any service row. The backend adds `GET /api/v1/route-tracker`.
- **Saved stops** (#15). The star now sits inside the stop card.
- **Header** (#13). The OnLah wordmark goes to the home page.
- **Version** (#12). The web version rises by 0.1 on every commit.

### 19 to 20 October 2026

- **Saved buses** (#5). Star one bus at one stop to save it. The app opens on Saved, which shows live times for each saved bus.
- **UI review** (#6 to #11).
  - Services sort in natural order (2, 10, 100).
  - Each screen has its own URL, such as `/stop/01121`.
  - Search shows a "Searching" status and explains when a slow server is waking up.
  - The tab bar stays on screen.
  - The original cream page and crowd-coloured tiles are back.
  - Bus types read Single, Double or Bendy.
  - All ETA tiles are the same size.
  - The header shows "Beta" with the version.
  - "Show in Maps" sits under the stop address.
  - Refresh is a single icon.

### 18 October 2026

- **Web bus board** (#3). The first web client shows arrivals with crowd colours, search, nearby stops, saved stops, and the MRT disruption banner.
- **Service details** (#3). Tap a service number to see its operator, route, hours by day and frequency. The backend adds `GET /api/v1/bus-services/{serviceNo}` and an admin sync of the bus network from LTA.
- **Deployment** (#3, #4). A Dockerfile, a health check and CORS set from the environment get the backend ready to deploy. The web build reads its API address from the environment and explains a slow first load. Pull requests run CI checks.

### 17 October 2026

- **Mobile app** (#2). The React Native app shows arrivals, nearby stops, search, saved stops and MRT alerts.

### 25 June 2026

- **Backend v1** (#1). The .NET 10 API proxies LTA real-time arrivals (v3 Bus Arrival endpoint) and MRT disruption alerts. It serves nearby stops from its own database and has an admin endpoint to sync all bus stops from LTA.

## License

[Add license here]
