# OnLah — Developer Handover

**Date:** 2 July 2026
**Branch:** `dev`
**Status:** v1 feature-complete, not yet deployed

---

## What Has Been Built

OnLah is a Singapore public transit app. v1 covers real-time bus arrivals for favourited stops, nearby stop discovery, crowd level indicators, MRT disruption alerts, and bus stop search.

### Completed Features

| Feature | Mobile | Backend |
|---|---|---|
| Real-time bus arrivals (auto-refresh 20s) | Done | Done |
| Favourite stops (max 10, persisted) | Done | N/A — AsyncStorage |
| Nearby stops (500m GPS radius) | Done | Done |
| Crowd level indicators (green/amber/red) | Done | Done |
| MRT disruption banner (auto-refresh 2min) | Done | Done |
| ETA freshness timestamp | Done | Done |
| Search bus stop by code or name | Done | Done |

---

## Repository Layout

```
OnLah/
├── apps/
│   ├── mobile/          — React Native (Expo SDK 54)
│   └── backend/         — .NET 10 C# Minimal API
├── docs/Claude/         — App guide and LTA API reference
└── CLAUDE.md            — Claude Code project instructions
```

---

## Running Locally

### Prerequisites

- Node.js 20+, npm
- .NET 10 SDK
- PostgreSQL (local or Docker)
- Expo Go on iPhone (same WiFi as Mac)

### Backend

```bash
cd apps/backend/src/OnLah.Api

# Create appsettings.Development.json with your secrets (see Configuration below)
dotnet run
```

Backend listens on `http://0.0.0.0:5050`.

### Mobile

```bash
cd apps/mobile

# Set your Mac's local IP in .env (already done for 192.168.10.36)
# If your IP changes: update EXPO_PUBLIC_API_URL in apps/mobile/.env

npx expo start --clear
```

Scan the QR code with Expo Go on your iPhone.

> Note: your iPhone and Mac must be on the same WiFi. To verify the backend is reachable from your phone, open Safari and navigate to `http://<your-mac-ip>:5050/api/v1/train-alerts`.

---

## Configuration

### Backend — `appsettings.Development.json`

Create this file at `apps/backend/src/OnLah.Api/appsettings.Development.json` (gitignored):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=onlah;Username=postgres;Password=yourpassword"
  },
  "Lta": {
    "AccountKey": "your-lta-datamall-account-key",
    "BaseUrl": "http://datamall2.mytransport.sg/ltaodataservice"
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:8081"]
  }
}
```

### Mobile — `apps/mobile/.env`

```
EXPO_PUBLIC_API_URL=http://<your-mac-local-ip>:5050
```

Find your Mac's IP: `ipconfig getifaddr en0`

---

## Backend API Endpoints

All routes are prefixed `/api/v1/`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/bus-arrivals?stopCode=XXXXX` | Live bus arrivals for a stop (LTA v3) |
| `GET` | `/bus-stops/nearby?lat=&lng=&radiusMeters=` | Stops within radius (max 5000m) |
| `GET` | `/bus-stops/search?query=` | Search stops by code or name (min 2 chars) |
| `GET` | `/train-alerts` | Current MRT disruption alerts |
| `GET` | `/bus-services/{serviceNo}` | Service details: directions, hours, frequency |
| `GET` | `/route-tracker?busStopCode=&serviceNo=&direction=` | One service at one stop: ordered stops, the user's stop, and each bus's ETA and stops away. Never cached. `direction` (1 or 2) is optional |
| `POST` | `/admin/bus-stops/sync` | Sync all bus stops from LTA into PostgreSQL |
| `POST` | `/admin/bus-network/sync` | Sync BusServices and BusRoutes from LTA into PostgreSQL |

> Run both sync endpoints once after first boot, otherwise nearby, search, service details and the route tracker will return empty results. Nothing refreshes them on a schedule yet, so re-run them about weekly.

---

## Backend Architecture

Clean Architecture with four layers:

```
OnLah.Api           — Minimal API endpoints, middleware, DI wiring
OnLah.Application   — Use-case services, DTOs
OnLah.Domain        — Entities, repository interfaces, Result<T> type
OnLah.Infrastructure — EF Core (PostgreSQL), LTA HTTP clients
```

Key patterns:
- All LTA calls go through typed HTTP clients in `Infrastructure/Lta/`
- `Result<T>` used for error propagation without exceptions
- `IBusStopRepository` abstracts all DB access for bus stops
- FluentValidation on every endpoint input

---

## Mobile Architecture

Feature-based folder structure under `src/`:

```
src/
├── app/
│   ├── navigation/      — Tab + stack navigators, param types
│   └── providers/       — Font loading, SafeAreaProvider
├── features/
│   ├── arrivals/        — ArrivalScreen, useArrivals
│   ├── disruptions/     — DisruptionBanner, useDisruptions
│   ├── favourites/      — FavouritesScreen, FavouriteStopCard, useFavourites
│   ├── nearby/          — NearbyScreen, useNearbyStops
│   └── search/          — SearchScreen, useSearchBusStops
├── shared/
│   ├── components/      — BusArrivalRow, CrowdBadge, ETADisplay
│   ├── hooks/           — useAutoRefresh, useLocation
│   ├── services/        — apiClient, onlahApi
│   ├── stores/          — favouritesStore (persisted), disruptionStore (memory)
│   ├── theme/           — colors, typography, spacing
│   └── utils/           — eta, crowdLevel, haversine
└── types/
    └── domain.ts        — All shared TypeScript types
```

Key decisions:
- C# enums serialised as integers: `CrowdLevel` 0/1/2, `TrainServiceStatus` 0/1
- Favourites store uses AsyncStorage via Zustand `persist` middleware
- `useAutoRefresh` fires immediately on mount, then on interval
- Each `FavouriteStopCard` manages its own arrival poll independently
- Navigation: three bottom tabs (Home, Nearby, Search), each with its own native stack

### Navigation Structure

```
RootTab
├── HomeTab
│   ├── Favourites (FavouritesScreen)
│   └── Arrivals  (ArrivalScreen)
├── NearbyTab
│   ├── NearbyList (NearbyScreen)
│   └── Arrivals   (ArrivalScreen)
└── SearchTab
    ├── Search   (SearchScreen)
    └── Arrivals (ArrivalScreen)
```

---

## First-Time Setup Checklist

- [ ] Obtain LTA DataMall API key from [datamall.lta.gov.sg](https://datamall.lta.gov.sg)
- [ ] Create `appsettings.Development.json` with DB connection string and LTA key
- [ ] Create PostgreSQL database (`onlah`)
- [ ] Run EF Core migrations: `dotnet ef database update` from `apps/backend/src/OnLah.Api/`
- [ ] Start backend: `dotnet run`
- [ ] Seed bus stops: `POST /api/v1/admin/bus-stops/sync` (one-time, ~5000 stops)
- [ ] Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to your Mac's local IP
- [ ] Start mobile: `npx expo start --clear` from `apps/mobile/`

---

## Known Gaps / v2 Work

- Search is not yet reachable from the Home screen search bar (tapping it navigates to SearchTab but the input isn't auto-focused)
- Stop names are not stored in the favourites store — home screen shows "Stop XXXXX" instead of the stop description
- No EF Core migration files exist yet — schema was created manually or needs `dotnet ef migrations add InitialCreate`
- Android not tested (codebase is cross-platform, store submission is v2)
- No backend deployment — currently local only
- LTA AccountKey must be rotated before any public deployment

---

## Tech Stack Summary

| Layer | Technology | Version |
|---|---|---|
| Mobile | React Native + TypeScript | Expo SDK 54, RN 0.81 |
| Navigation | React Navigation | v7 |
| State | Zustand | 4.5 |
| Backend | .NET C# Minimal API | .NET 10 |
| Database | PostgreSQL + EF Core | EF Core 10 |
| LTA integration | LTA DataMall REST API | v3 (bus arrivals) |
