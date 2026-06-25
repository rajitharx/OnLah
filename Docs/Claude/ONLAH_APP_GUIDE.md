# OnLah — App Creation Guide for Claude Code

> This document is the authoritative guidance file for building the OnLah iOS app.  
> Read this before writing any code. Reference it when making architectural decisions.

---

## What Is OnLah?

OnLah is a Singapore public transit app for **habitual commuters**. The core use case is fast, frictionless access to bus arrival times and transit status from a small set of familiar stops.

It is **not** a journey planner. It is **not** a maps app. It is a bus timing + disruption awareness tool that works well for people who already know their routes.

---

## v1 Success Definition

v1 is complete when it passes all five bars:

| Bar | Definition |
|-----|-----------|
| **Functional** | All five core features work correctly with live LTA data |
| **Performance** | Bus arrivals load within 2 seconds on a standard SG connection |
| **Stable** | No crashes during a full week of daily commute use |
| **Distributed** | Live on the iOS App Store |
| **Validated** | Real commuters use the app over a working week and find it useful |

---

## Target User

**Primary:** Singapore resident, daily commuter, aged 20–45.  
Knows their regular stops. Doesn't need a map. Wants to glance at the app and know: "Can I catch the next bus? Is the MRT line affected today?"

**Not the target:** Tourist navigating an unfamiliar city. That's v3+.

---

## v1 Feature Scope

### In Scope (build these)

1. **Real-time bus arrivals** — query `BusArrivalv2` (v3 endpoint) by bus stop code; show next 3 buses per service with ETA in minutes and crowd level indicator
2. **Nearby stop discovery** — use device GPS + local bus stop database (`BusStops` API) to show stops within ~500m
3. **Crowd level indicators** — use `Load` field from Bus Arrival response; colour-code SEA/SDA/LSD per LTA spec (green/amber/red)
4. **MRT disruption alerts** — poll `TrainServiceAlerts`; show a banner when `Status = 2` on lines that serve the user's area; include the advisory message
5. **ETA freshness timestamp** — display when the arrival data was last fetched; auto-refresh every 20 seconds

### Out of Scope for v1 (do not build)

- Full disruption rerouting or alternate route suggestions
- Live bus position on map
- ETA reliability scoring / historical accuracy tracking
- Multi-modal journey planning (bus + MRT combined routing)
- Android store submission (codebase is shared; Android ships in v2)
- User accounts / server-synced favourites
- MRT crowd density (the Station Crowd Density API data is historical pattern, not truly real-time — defer)
- Passenger volume statistics

---

## Platform & Tech Stack

### Mobile App

- **Framework:** React Native (Expo managed workflow)
- **Language:** TypeScript (strict mode)
- **Minimum iOS:** 16.0 | **Minimum Android:** API 29 (Android 10)
- **Architecture:** Feature-based with custom hooks + Zustand stores
- **State management:** Zustand (lightweight, no boilerplate)
- **Navigation:** React Navigation v6 (bottom tabs + stack)
- **Networking:** `fetch` via a shared `apiClient.ts` wrapper
- **Location:** `expo-location`
- **Local storage (favourites):** `AsyncStorage` for v1; no backend auth required
- **Fonts:** JetBrains Mono (embedded via `expo-font`)
- **Icons:** `@expo/vector-icons` (Feather set)

> **Release strategy:** v1 ships iOS first via App Store. Android follows in v2 — the React Native codebase is shared, only store submission and platform testing differ.

### Backend

- **Framework:** .NET 8 Minimal API (ASP.NET Core)
- **Language:** C# 12
- **Database:** PostgreSQL
- **Hosting options (in order of cost):** Railway → Render → Azure App Service
- **Purpose in v1:** LTA API proxy (keeps AccountKey off the mobile client), caching layer for static datasets (BusStops, BusRoutes, BusServices)

> **Security note:** The LTA AccountKey must NEVER be embedded in the mobile app bundle. All LTA DataMall calls are made server-side by the C# backend; the mobile app only calls the OnLah API.

---

## Project Structure

Monorepo with two workspaces under `apps/`: `mobile/` (React Native) and `backend/` (C#).

```
OnLah/
├── apps/
│   ├── mobile/                          # React Native app (Expo)
│   ├── src/
│   │   ├── app/
│   │   │   ├── index.tsx               # Entry point, providers
│   │   │   ├── navigation/
│   │   │   │   ├── RootNavigator.tsx
│   │   │   │   └── TabNavigator.tsx
│   │   │   └── providers/
│   │   │       └── AppProviders.tsx    # Theme, store, location providers
│   │   ├── features/
│   │   │   ├── arrivals/
│   │   │   │   ├── ArrivalScreen.tsx
│   │   │   │   ├── useArrivals.ts
│   │   │   │   └── types.ts
│   │   │   ├── nearby/
│   │   │   │   ├── NearbyScreen.tsx
│   │   │   │   └── useNearbyStops.ts
│   │   │   ├── favourites/
│   │   │   │   ├── FavouritesScreen.tsx
│   │   │   │   └── useFavourites.ts
│   │   │   └── disruptions/
│   │   │       ├── DisruptionBanner.tsx
│   │   │       └── useDisruptions.ts
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── BusArrivalRow.tsx   # Reusable arrival row tile
│   │   │   │   ├── CrowdBadge.tsx      # SEA/SDA/LSD colour pill
│   │   │   │   ├── ETADisplay.tsx      # "3 min" / "Arr" display
│   │   │   │   ├── StopCard.tsx        # Stop summary card
│   │   │   │   └── index.ts            # Barrel export
│   │   │   ├── hooks/
│   │   │   │   ├── useLocation.ts
│   │   │   │   └── useAutoRefresh.ts
│   │   │   ├── services/
│   │   │   │   ├── apiClient.ts        # Base fetch wrapper
│   │   │   │   └── onlahApi.ts         # All OnLah backend calls
│   │   │   ├── stores/
│   │   │   │   ├── favouritesStore.ts  # Zustand — persisted to AsyncStorage
│   │   │   │   └── disruptionStore.ts  # Zustand — in-memory
│   │   │   ├── theme/
│   │   │   │   ├── colors.ts
│   │   │   │   ├── typography.ts
│   │   │   │   ├── spacing.ts
│   │   │   │   └── index.ts
│   │   │   └── utils/
│   │   │       ├── eta.ts              # ETA rounding, "Arr" logic
│   │   │       ├── haversine.ts        # Distance calculation
│   │   │       └── crowdLevel.ts       # Load → colour/label mapping
│   │   └── types/
│   │       ├── lta.ts                  # LTA API response shapes
│   │       └── domain.ts               # App-level types (Stop, Route…)
│   ├── assets/
│   │   ├── fonts/                      # JetBrains Mono files
│   │   └── icons/
│   ├── __tests__/
│   ├── app.json
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                            # .NET 8 C# API
│   ├── src/
│   │   ├── OnLah.Api/
│   │   │   ├── Endpoints/
│   │   │   │   ├── BusArrivalEndpoints.cs
│   │   │   │   ├── BusStopEndpoints.cs
│   │   │   │   └── DisruptionEndpoints.cs
│   │   │   ├── Program.cs
│   │   │   └── appsettings.json
│   │   ├── OnLah.Core/
│   │   │   ├── Models/
│   │   │   └── Interfaces/
│   │   └── OnLah.Infrastructure/
│   │       ├── LtaApiClient.cs
│   │       ├── BusStopRepository.cs
│   │       └── CacheService.cs
│   └── tests/
│       └── OnLah.Tests/
│
├── Docs/
│   └── Claude/
│       ├── ONLAH_APP_GUIDE.md
│       └── LTA_DATAMALL_API.md
│
└── .claude/
    ├── CLAUDE.md                       # Auto-loaded project context
    └── commands/
        └── ui.md                       # /ui skill — design system rules
```

---

## LTA API Integration Rules

> Full API reference: see `LTA_DATAMALL_API.md` in this project

### Authentication

Every request needs the `AccountKey` header:

```swift
var request = URLRequest(url: url)
request.setValue(apiKey, forHTTPHeaderField: "AccountKey")
request.setValue("application/json", forHTTPHeaderField: "Accept")
```

### Bus Arrival — Key Rules

- Call `/v3/BusArrival?BusStopCode=XXXXX` — always v3
- **Empty response = bus not in service OR API down.** Do not treat as an error. Determine which advisory to show using Bus Routes operating hours data.
- `Monitored: 0` = schedule-based ETA. Show a visual indicator (e.g. clock icon). Do NOT render bus location on a map.
- ETA rounding: truncate seconds, round down to nearest minute. If `< 1 min`, display `"Arr"`.
- Refresh every 20 seconds. Show the last-fetched timestamp.

### Bus Stops — Key Rules

- Fetch all stops once and cache locally (SQLite or in-memory store)
- Paginate with `$skip=0`, `$skip=500`, etc. until response has fewer than 500 records
- Bus stop codes are **5-digit strings** (e.g. `"01012"`) — always treat as String, never Int
- For nearby discovery: filter cached stops by haversine distance from user GPS coordinates

### Train Service Alerts — Key Rules

- No request parameters — returns all current alerts across all lines
- `Status: 1` = normal or minor delays → suppress disruption UI
- `Status: 2` = major disruption → show disruption card with `Line`, `Direction`, `Stations`, and `Message.Content`
- Multiple lines can be disrupted simultaneously — iterate all clusters in the response
- Poll every 2 minutes; don't call on every screen refresh

### Crowd Level Display

Always map `Load` values to colour:

```swift
enum CrowdLevel: String {
    case seatsAvailable = "SEA"
    case standingAvailable = "SDA"
    case limitedStanding = "LSD"

    var colour: Color {
        switch self {
        case .seatsAvailable: return .green
        case .standingAvailable: return Color.orange
        case .limitedStanding: return .red
        }
    }

    var label: String {
        switch self {
        case .seatsAvailable: return "Seats"
        case .standingAvailable: return "Standing"
        case .limitedStanding: return "Crowded"
        }
    }
}
```

---

## UI & Design Direction

### Aesthetic

- **Dark-first** UI (inspired by Nothing Phone aesthetic)
- Monospace typography for timing data: prefer `SF Mono` (system), or `JetBrains Mono` / `Berkeley Mono` as embedded fonts
- Split-flap departure board vibe for bus timing rows — dark tiles, high contrast white/amber text
- Warm neutral accents (reference Anthropic website palette: warm cream `#F5ECD7`, not clinical white)

### Key UX Patterns

- **Home screen = Favourites.** User opens the app and immediately sees their saved stops' arrivals. No navigation required.
- **Arrival tiles are the primary unit.** Each tile shows: stop name, service number, next 3 ETAs with crowd dots/bars.
- **No map on home.** Map is a secondary discovery tool for finding nearby stops, not the default view.
- **Disruption banner is dismissible but persistent** until the alert clears. Show above the arrivals list, not as a modal.
- **Auto-refresh is silent.** The freshness timestamp ("Updated 5s ago") communicates recency without loading spinners on every poll.

### Typography

```swift
// ETA display
.font(.custom("SF Mono", size: 28)).bold()

// Stop name
.font(.system(size: 16, weight: .semibold))

// Service number badge
.font(.custom("SF Mono", size: 14))
```

### Colour Tokens

```swift
extension Color {
    static let onlahBackground = Color(hex: "0D0D0D")   // near-black
    static let onlahSurface    = Color(hex: "1A1A1A")   // card background
    static let onlahAccent     = Color(hex: "F5ECD7")   // warm cream
    static let onlahMuted      = Color(hex: "666666")   // secondary text
    static let arrivalGreen    = Color(hex: "4CAF50")   // SEA
    static let arrivalAmber    = Color(hex: "FF9800")   // SDA
    static let arrivalRed      = Color(hex: "F44336")   // LSD
}
```

---

## Data Freshness Architecture

| Data | Source | Strategy |
|------|--------|----------|
| Bus arrivals | LTA BusArrival API | Live — never cache; poll every 20s |
| Bus stops DB | LTA BusStops API | Local DB; refresh weekly |
| Bus routes / services | LTA BusRoutes + BusServices | Local DB; refresh weekly |
| Train alerts | LTA TrainServiceAlerts | Poll every 2 min; display last-fetched time |
| Favourites | UserDefaults | Persist locally; no sync in v1 |

---

## Favourites (v1)

- Store as an ordered array of bus stop codes in `UserDefaults`
- Max 10 favourites for v1 (prevents performance issues on home screen)
- On home screen, show arrivals for all favourited stops in sequence
- No account / sign-in required in v1

```swift
struct FavouritesStore {
    private let key = "onlah.favourites"

    var stops: [String] {
        get { UserDefaults.standard.stringArray(forKey: key) ?? [] }
        set { UserDefaults.standard.set(newValue, forKey: key) }
    }

    mutating func add(_ code: String) {
        guard !stops.contains(code), stops.count < 10 else { return }
        stops.append(code)
    }

    mutating func remove(_ code: String) {
        stops.removeAll { $0 == code }
    }
}
```

---

## App Store Requirements

Before submitting to the App Store:

1. **Apple Developer Account** — required; enrol at developer.apple.com (~$99 USD/year)
2. **Privacy Policy URL** — required for any app using location data; host a simple page at your domain
3. **Location usage description** in `Info.plist`:
   - `NSLocationWhenInUseUsageDescription`: `"OnLah uses your location to show nearby bus stops."`
4. **App icons** — all required sizes; use Xcode's asset catalog
5. **Screenshots** — minimum 3 per supported device (iPhone 6.7", 6.5", 5.5")
6. **No hardcoded API keys** in the binary before public release — proxy via backend

---

## Testing Strategy

### Unit Tests

- ETA calculation and rounding logic
- Crowd level mapping (SEA/SDA/LSD → colour/label)
- Bus operating hours check (in service vs not in service)
- Haversine distance calculation for nearby stops
- JSON decoding for all LTA API response shapes

### Integration Tests

- Live LTA API connectivity (validate AccountKey + endpoint before building UI)
- Empty response handling for Bus Arrival
- Pagination loop for BusStops full dataset download

### Manual / QA

- Test at real Sengkang stops during morning peak (8–9am) and evening peak (6–7pm)
- Verify crowd indicators match observed bus fullness
- Test disruption banner with `Status: 2` (simulate or wait for real disruption)
- Test at night when buses are not in service — confirm "Not In Operation" advisory shows

---

## Known API Limitations & Gotchas

| Issue | Detail |
|-------|--------|
| MRT crowd data is NOT real-time | `PCDRealTime` updates every 10 min and reflects historical patterns. Do not market as live crowd. |
| ETA reliability scoring not available | There is no accuracy feed — would need a custom data pipeline. Defer to v2+. |
| Bus Arrival can return empty body | Not an HTTP error. Must handle gracefully in Swift (guard against empty `Data`). |
| Pagination MUST use `$skip` | There is no cursor or `nextPage` field — just increment by 500. |
| Bus stop codes are strings | Always `"01012"` not `1012`. Codable model must use `String`, not `Int`. |
| TrainServiceAlerts returns all lines | Filter client-side to lines near the user's favourited stops. |
| Traffic Images links expire in 5 min | Not used in v1; note for future. |
| Planned Bus Routes: respect EffectiveDate | Do not display planned route data before its `EffectiveDate`. |

---

## Definition of Done (Per Feature)

### Bus Arrivals
- [ ] Correct ETA in minutes for all 3 buses
- [ ] Crowd level colour badge visible
- [ ] Wheelchair accessible indicator visible when `Feature = WAB`
- [ ] Schedule indicator visible when `Monitored = 0`
- [ ] "Arr" shown when ETA < 1 min
- [ ] Advisory message shown when no data returned
- [ ] Auto-refreshes every 20 seconds; freshness timestamp updates

### Nearby Stops
- [ ] Requests location permission with clear purpose string
- [ ] Shows bus stops within ~500m sorted by distance
- [ ] Tapping a stop opens its arrivals
- [ ] Works without network for stop list (uses local cache)

### Crowd Level
- [ ] Green / Amber / Red displayed per LTA colour spec
- [ ] Works for all three buses (NextBus, NextBus2, NextBus3)
- [ ] Empty Load gracefully handled (no colour shown)

### MRT Disruption Alerts
- [ ] No banner shown when `Status = 1`
- [ ] Banner appears immediately when `Status = 2`
- [ ] Shows affected line, direction, and advisory message
- [ ] Banner dismissible but re-appears on next poll if disruption persists

### ETA Freshness
- [ ] Timestamp updates after each successful refresh
- [ ] Shows elapsed time since last update ("Updated 5s ago")
- [ ] Distinguishes between refreshing and stale states

---

---

## Crowd Level Display (React Native)

```ts
type CrowdLevel = 'SEA' | 'SDA' | 'LSD' | ''

const crowdConfig: Record<string, { color: string; label: string }> = {
  SEA: { color: '#4CAF50', label: 'Seats' },
  SDA: { color: '#FF9800', label: 'Standing' },
  LSD: { color: '#F44336', label: 'Crowded' },
}
```

Import colours from `mobile/src/shared/theme/colors.ts` — never hardcode hex values in components.

---

*OnLah v1 — Guide version: June 2026 — Stack: React Native + TypeScript + .NET 8 C#*
