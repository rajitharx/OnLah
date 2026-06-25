# OnLah

A fast, accurate bus timing app for Singapore commuters built on LTA DataMall APIs.

## What is OnLah?

OnLah is a mobile app designed for the **habitual Singapore commuter** — someone who checks bus times multiple times a day from a fixed set of stops. Unlike feature-bloated transit apps that crash or show wildly inaccurate ETAs, OnLah is laser-focused on **speed, accuracy, and reliability**.

Open the app. Find your stop. See your bus. Three taps, cold launch to answer. That's it.

## Key Features (v1)

| Feature | Description |
|---|---|
| Real-Time Bus Arrivals | Live ETAs, crowd level, and wheelchair accessibility per arrival |
| Nearby Stop Discovery | Haversine-filtered stops within a configurable radius |
| MRT Disruption Alerts | Live train service alerts proxied from LTA |
| Bus Stop Sync | Admin-triggered full sync of ~5,000 SG bus stops from LTA |

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + TypeScript (Expo managed workflow) |
| Navigation | React Navigation v6 |
| State | Zustand |
| Backend | .NET 10 C# Minimal API |
| Database | PostgreSQL |
| Data Source | LTA DataMall API v3 |

## Monorepo Structure

```
apps/
  mobile/          → React Native app (Expo)
  backend/         → .NET 10 C# API
Docs/
  Claude/          → App guide and LTA API reference
.claude/           → Claude Code skills and config
```

## Backend API

Base URL: `http://localhost:5050/api/v1`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/bus-arrivals?stopCode={5-digit}` | Real-time arrivals for a stop |
| GET | `/bus-stops/nearby?lat=&lng=&radiusMeters=` | Nearby stops from local DB |
| GET | `/train-alerts` | Current MRT disruption alerts |
| POST | `/admin/bus-stops/sync` | Sync all bus stops from LTA |

## Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- PostgreSQL running locally
- LTA DataMall API key ([register here](https://datamall.lta.gov.sg))
- Node.js + [Expo CLI](https://docs.expo.dev/get-started/installation/) for mobile

### Backend Setup

```bash
# 1. Store secrets (one-time)
cd apps/backend/src/OnLah.Api
dotnet user-secrets set "Lta__AccountKey" "your-lta-key"

# 2. Run
./apps/backend/run.sh
```

See [`apps/backend/COMMANDS.md`](apps/backend/COMMANDS.md) for all available commands.

## Out of Scope (v1)

- Live bus position on map
- Full disruption rerouting
- Multi-modal journey planning
- Account creation / server-synced favourites
- Android (iOS + Expo first; Android via Expo in v2)

## Roadmap

### v1 (Current)
- Core features: arrivals, nearby stops, crowd levels, MRT alerts
- React Native mobile app
- .NET 10 backend + PostgreSQL

### v2 (Planned)
- Full disruption rerouting with step-by-step navigation
- ETA reliability scoring
- Server-synced favourites

## License

[Add license here]
