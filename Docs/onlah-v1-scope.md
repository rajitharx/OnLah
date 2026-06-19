# OnLah – v1 Scope Document

> Singapore public transit timing app · iOS · Initial release definition

---

## 1. What is in scope for v1?

Five features, defined tightly. Nothing else.

### Real-time bus arrivals + favourites
Show live ETAs for any bus stop, sourced from the LTA `BusArrivalv2` API. Favourite stops load on the home screen instantly. Stops can be renamed and reordered. Maximum three taps from cold launch to seeing your bus time.

### Nearby stop discovery
Detect the user's location and surface the closest bus stops with live arrivals inline. No manual search required for the common case of "what can I catch near me right now."

### Crowd level indicator
Display the load status returned by `BusArrivalv2` (Seat Available / Standing Available / Limited Standing) as a colour-coded signal next to each arrival — green, amber, red. No additional API call required; this data comes free with every arrival request.

### MRT disruption alerts (scoped)
Subscribe to `Train Service Alerts`. Push a notification when a disruption is detected on lines the user cares about. Show which stations are affected and surface nearby bus arrival times as a fallback. No turn-by-turn rerouting in v1.

### ETA freshness timestamp
Show when the arrival data was last updated — a small "Updated Ns ago" label per stop. Addresses the trust problem with inaccurate ETAs without requiring a historical data pipeline.

---

## 2. What is explicitly out of scope?

### Live bus position on map
Coordinate reliability from `BusArrivalv2` needs to be validated before committing to this. SG BusLeh already does it well. Not a meaningful differentiator for v1.

### Full disruption rerouting
Step-by-step alternative navigation during MRT failures is a distinct and complex feature. Alerting and surfacing nearby buses is sufficient for v1.

### ETA reliability scoring
Accurate / Delayed / Uncertain badges require a custom pipeline against historical arrival data. LTA DataMall does not provide this. Deferred to v2+.

### Multi-modal journey planning
No route planner. No "get me from A to B" functionality. Google Maps and Citymapper already do this. v1 is a commute monitor, not a navigation app.

### MRT arrival times
MRT operates on fixed schedules with no real-time per-train ETA from LTA DataMall. The disruption alert covers the only genuinely useful MRT data available at this stage.

### ERP, taxi, carpark, and traffic camera features
All from the innovative feature list in the research report. All deferred. They add complexity without serving the core commuter use case in v1.

### Android
v1 is iOS only (SwiftUI). Android via Flutter is Phase 2.

### Account creation / server-synced favourites
Favourites are stored locally on device in v1. No authentication, no backend user management, no cross-device sync.

---

## 3. Target user

**The habitual Singapore commuter** — someone who takes the same two or three bus services most days, from a fixed set of stops near home, work, or school.

They open a transit app in a specific moment of anxiety: standing at a stop, not sure if their bus is coming or already gone, deciding whether to wait or walk. They are time-pressured, doing this on a phone with one hand, and they need one answer fast.

### Secondary characteristics
- Already using MyTransport.SG or SG BusLeh — they have baseline expectations
- Check bus times multiple times a day
- Have developed habitual frustration with existing apps crashing or showing wrong ETAs

### Who this does not describe
- Tourists needing route planning
- Drivers weighing ERP costs
- Commuters exploring new routes

Those are real users but not the v1 target. Designing for the habitual commuter first means the product gets narrow, fast, and reliable — which is the right foundation.

---

## 4. Definition of done for v1

Done is not "feature complete." Done means the app is in the App Store and real commuters are using it daily.

### Functional bar
All five in-scope features work correctly against live LTA DataMall data. Arrivals are accurate. Crowd indicators show. Disruption notifications fire. Freshness timestamps update. The app does not crash.

### Performance bar
Home screen (favourites + live ETAs) loads in under two seconds on a standard Singapore 4G connection. The app is usable with one hand while standing.

### Stability bar
No crashes on cold launch. Graceful handling of API timeouts or missing data — shows last known value plus freshness timestamp rather than a broken state.

### Distribution bar
Live on the iOS App Store. Privacy policy in place. Apple Developer account active. App passes App Store review.

### Feedback bar
At least 20 real commuters have used it for a full working week and provided structured feedback. This output defines what v2 prioritises.

### What "done" does not mean
- Perfect ETA accuracy (that is a data quality problem upstream of the app)
- Feature parity with SG BusLeh
- Android availability

---

## Summary

v1 is a fast, reliable iOS bus timing app for Singapore habitual commuters, covering arrivals, nearby stops, crowd levels, and disruption alerts.

It is done when it is live on the App Store and people are actually using it.

---

*Generated from product research and MVP feature prioritisation analysis · OnLah project*
