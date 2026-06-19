# OnLah

A fast, accurate bus timing app for Singapore commuters built on LTA DataMall APIs.

## What is OnLah?

OnLah is an iOS app designed for the **habitual Singapore commuter**—someone who checks bus times multiple times a day from a fixed set of stops. Unlike feature-bloated transit apps that crash or show wildly inaccurate ETAs, OnLah is laser-focused on **speed, accuracy, and reliability**.

Open the app. Find your stop. See your bus. Three taps, cold launch to answer. That's it.

## Why OnLah?

The Singapore public transit app ecosystem is crowded, but fragmented. MyTransport.SG crashes. Existing apps show inconsistent arrival times. None combine all LTA DataMall datasets into one seamless experience.

OnLah addresses the core pain points:
- **Inconsistent arrival timing** – Smart ETA calibration and freshness transparency
- **Can't organise favourite stops** – Rename and reorder your frequent stops; they load instantly on home screen
- **No crowdedness visibility** – See real-time load status (Seat/Standing Available/Limited Standing) before boarding
- **Fragmented disruption alerts** – Subscribe to MRT disruption notifications and get nearby bus alternatives in one tap

## Key Features (v1)

### ✅ Real-Time Bus Arrivals + Favourites
- Live ETAs for any Singapore bus stop
- Save, rename, and reorder your favourite stops
- Instant home screen load of your most-used services
- Maximum three taps from cold launch to seeing your bus time

### 📍 Nearby Stop Discovery
- Automatic detection of closest bus stops to your location
- Live arrivals shown inline—no manual search needed
- Perfect for the common case: "What can I catch right now?"

### 👥 Crowd Level Indicator
- Colour-coded load status next to each arrival (Green 🟢 / Amber 🟡 / Red 🔴)
- Know before you board: Seat Available → Standing Available → Limited Standing
- Sourced from LTA BusArrivalv2 API at no extra cost

### 🚇 MRT Disruption Alerts (Scoped)
- Subscribe to Train Service Alerts for lines you care about
- Push notification when a disruption is detected
- See which stations are affected and nearby bus alternatives at a glance
- No turn-by-turn rerouting in v1 (planned for v2)

### 🕐 ETA Freshness Timestamp
- "Updated 12s ago" label next to each arrival
- Addresses the trust problem with inaccurate ETAs
- Shows you whether the data is stale or real-time

## Out of Scope (v1)

To keep v1 fast and focused, the following are intentionally deferred:

- **Live bus position on map** – Coordinate reliability needs validation; SG BusLeh already does this well
- **Full disruption rerouting** – Step-by-step alternative navigation (v2+)
- **Multi-modal journey planning** – No route planner; Google Maps and Citymapper do this better
- **ERP, taxi, carpark, and traffic camera features** – Innovative features, deferred to v2+
- **Account creation / server-synced favourites** – Local device storage only in v1
- **Android** – iOS only; Flutter for Android is Phase 2

## Target User

**The habitual Singapore commuter** who:
- Takes the same two or three bus services most days
- Checks bus times multiple times daily
- Opens the app standing at a stop, under time pressure, deciding whether to wait or walk
- Is frustrated by crashes and inaccurate ETAs in existing apps

### Not for (in v1):
- Tourists needing route planning
- Drivers weighing ERP costs
- Commuters exploring new routes

## Tech Stack

- **Platform**: iOS (SwiftUI)
- **Data Source**: LTA DataMall APIs
  - BusArrivalv2 (real-time arrivals, load status, coordinates)
  - Train Service Alerts (MRT disruptions)
- **Local Storage**: Device-only (no cloud sync in v1)

## Definition of Done (v1)

Done means the app is live on the iOS App Store and real commuters are using it daily.

### Functional Bar
- All five in-scope features work correctly against live LTA DataMall data
- Arrivals are accurate
- Crowd indicators display correctly
- Disruption notifications fire reliably
- App does not crash

### Performance Bar
- Home screen (favourites + live ETAs) loads in **under 2 seconds** on standard Singapore 4G

### Stability Bar
- No crashes on cold launch
- Graceful handling of API timeouts (shows last known value + freshness timestamp)

### Distribution Bar
- Live on iOS App Store
- Privacy policy in place
- Passes App Store review

### Feedback Bar
- At least 20 real commuters have used it for a full working week
- Structured feedback collected to define v2 priorities

## Getting Started

### Prerequisites
- Xcode 13+ (iOS 15+)
- LTA DataMall API key ([Register here](https://datamall.lta.gov.sg))
- Location services enabled on device

### Installation

```bash
git clone https://github.com/yourusername/OnLah.git
cd OnLah
# Add your LTA API key to Config.swift
xcode build && run
```

## Project Structure

```
OnLah/
├── Docs/
│   ├── project-OnLah.md          # Full market research & feature analysis
│   └── onlah-v1-scope.md         # MVP definition & scope constraints
├── README.md                      # This file
└── [iOS source code]
```

## Contributing

Contributions are welcome, but v1 is tightly scoped. Please review `Docs/onlah-v1-scope.md` before proposing features. In-scope contributions:
- Bug fixes
- Performance optimizations
- UI/UX polish for the five core features
- API resilience improvements

Out-of-scope for v1 (but good for v2 discussion):
- New API integrations
- Route planning
- Android features
- Server-side infrastructure

## Roadmap

### v1 (Current)
- Five core features (arrivals, favourites, nearby, crowds, disruptions)
- iOS App Store launch
- Real-world user feedback collection

### v2 (Planning)
- Full disruption rerouting with step-by-step navigation
- ETA reliability scoring (Accurate/Delayed/Uncertain badges)
- Android via Flutter
- Server-synced favourites (optional account sync)
- Enhanced disruption command centre

### v3+ (Backlog)
- ERP-aware route costing
- Park & Ride planner
- Taxi stand finder + real-time availability
- Traffic camera route preview
- Weather-adaptive routing (rain-ready routes)

## License

[Add license here]

## Contact

For questions, feedback, or feature requests, please reach out via [GitHub Issues](https://github.com/yourusername/OnLah/issues).

---

**OnLah**: One app to rule them all—accurate, comprehensive, proactive, and transparent.
