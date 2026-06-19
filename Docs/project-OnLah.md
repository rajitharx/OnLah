# Singapore Public Transport Timing App – Product Research Report

## 1. Landscape of Existing Singapore Public Transit Timing Apps

Singapore's public transport app ecosystem is mature, with offerings ranging from the official LTA app to third-party specialised timers and full-featured navigation platforms. Below is a summary of the major players, their core timing features, and extra capabilities.

| App | Core Timing Features | Extra Capabilities | Notes |
|-----|---------------------|-------------------|-------|
| **MyTransport.SG** (LTA Official) | Real-time bus arrival times; MRT service updates; traffic conditions; parking availability[reference:0] | Personalisation (frequent routes); push notifications for MRT/road alerts; "Near You" for nearby services/stations; multi-modal journey planner[reference:1][reference:2] | Official app but plagued by accuracy complaints and crashes[reference:3][reference:4] |
| **Citymapper** | Real-time bus/MRT arrival times; live disruption alerts; accurate travel time estimates[reference:5] | Multi-modal trip planning (bus+MRT+walk+cycle+ride-hail); step-by-step navigation; route comparisons by speed/cost[reference:6] | International navigation app; favoured for smarter route categorisation[reference:7] |
| **SG BusLeh** | Real-time bus arrival times; seat availability indicator (graphical bars); train timings[reference:8] | **Real-time bus location on map** (tap timing to see bus position); EZ-Link balance check; unified search (bus numbers, postal codes, building names, road names, bus stop IDs)[reference:9][reference:10] | Award-winning local app (LTA Most Innovative Solution 2016)[reference:11] |
| **SG Bus+MRT** | Live bus timing updates; nearest bus stops sorted by distance; MRT map[reference:12][reference:13] | Route/direction planning; nearby POI search[reference:14] | High user count (256k+) with 4.16 rating[reference:15] |
| **BusSing** | Real-time SG bus arrivals; MRT timings[reference:16] | Widgets; Apple Watch support; Live Activities (Dynamic Island); route planning[reference:17] | Marketed as "Singapore's fastest bus timing app"[reference:18] |
| **Google Maps** | MRT and bus routes with real-time schedules (~95% accuracy)[reference:19] | Nearby attractions/restaurants; offline maps; driving/walking directions[reference:20] | Versatile but sometimes neglects certain transit options[reference:21] |
| **SG Bus Timing** | Clean, simple bus arrival times (~90% accuracy)[reference:22] | Nearby bus stops[reference:23] | Ad-free; praised for simplicity but lacks advanced features[reference:24] |
| **Singabus** | Bus arrival times + MRT[reference:25] | Favourite stops adaptive to location[reference:26] | Simple, clean design; fast loading[reference:27] |


## 2. Missing Key Features in Current Apps

Based on user reviews, complaints, and feature gaps across the existing landscape, here are **8 specific pain points** that no app currently addresses well:

1. **Inconsistent / Inaccurate Bus Arrival Timing** – Users consistently report ETAs that are wildly off: "显示8分钟，结果巴士都走了"[reference:28], or waiting 15+ minutes for a bus that was "3 minutes away"[reference:29]. Even the official MyTransport.SG app suffers from this[reference:30][reference:31].

2. **No Real-Time Disruption Navigation** – During MRT disruptions, communication is fragmented across multiple channels. Commuters need centralised, real-time alternative route guidance during service failures[reference:32].

3. **Journey Planner Resets Mid-Trip** – MyTransport.SG resets during long journeys (e.g., 75-minute trips with bus changes), forcing users to memorise or screenshot their route[reference:33].

4. **Cannot Save / Organise Favourite Stops Properly** – Users cannot gather all favourite bus stops on one page, cannot rename stops, and cannot search for stops far away[reference:34].

5. **No "Next Stop" Announcement for Buses** – Buses often do not display the name of the next stop, making it difficult for visitors and even locals to know where to alight[reference:35].

6. **No Unified Search Across All Transport Entities** – While SG BusLeh has unified search[reference:36], most apps require separate searches for bus stops, MRT stations, and landmarks. Users want to search anything (postal codes, building names, road names) and get transport results.

7. **App Crashes and Performance Issues** – MyTransport.SG frequently crashes ("一直闪退"[reference:37], "app just crashes due to too many options"[reference:38]). SBS Transit app became slow after adding unrelated features (bicycle booking)[reference:39][reference:40].

8. **No Integration of "Cost vs Time" Trade-offs** – No app currently shows users the trade-off between taking a more expensive but faster route (e.g., taxi/ride-hail) vs a cheaper but slower public transport option, with real-time ERP/taxi/parking costs factored in.


## 3. Expected Features for a New Transit Timing App ("Table Stakes")

Based on the features offered by the top existing apps, users now expect the following as a **minimum**:

| Category | Expected Features |
|----------|-------------------|
| **Real-Time Arrivals** | Live bus arrival ETAs for all services at any bus stop; MRT/LRT service status and alerts[reference:41][reference:42] |
| **Nearby Discovery** | Automatic detection of nearest bus stops and MRT stations, sorted by distance[reference:43][reference:44] |
| **Route Planning** | Multi-modal journey planner (bus + MRT + walking) with step-by-step directions[reference:45][reference:46] |
| **Favourites / Bookmarks** | Save frequently used bus stops, services, and routes for quick access[reference:47] |
| **MRT / LRT Network Map** | Interactive map with station details, line transfers, and offline access[reference:48] |
| **Push Notifications** | Customisable alerts for MRT disruptions, road incidents, or bus service changes[reference:49] |
| **Clean, Fast UI** | Simple, intuitive interface that loads quickly and does not crash[reference:50][reference:51] |
| **Widgets / Lock Screen** | Home screen widgets, lock screen integration, and Apple Watch support for quick timing checks[reference:52] |


## 4. Innovative New Features Powered by LTA DataMall APIs

The LTA DataMall provides **15 public-transport-related datasets** plus additional traffic and mobility datasets[reference:53][reference:54]. Here are **8 innovative features** uniquely possible using these APIs:

### Feature 1: "Crowdedness Predictor" – Know Before You Board
**APIs Used:** Bus Arrival v2 (Load info / Estimated Current Load)[reference:55][reference:56]
**User Value:** The Bus Arrival v2 API returns estimated current load (Seat Available / Standing Available / Limited Standing). This app would show crowd levels **before** the bus arrives, allowing users to decide whether to wait for the next, less crowded bus—especially valuable during peak hours.

### Feature 2: "Rain-Ready Route" – Weather-Adaptive Journey Planning
**APIs Used:** Bus Arrival v2 + Bus Routes + Bus Stops (with coordinates)
**User Value:** By integrating with weather APIs, the app suggests routes that minimise walking exposure during rain—e.g., prioritising sheltered walkways, underground connections, or routes with more frequent buses to reduce waiting time in the rain.

### Feature 3: "Bus Stalker" – Live Bus Tracking on Map
**APIs Used:** Bus Arrival v2 (Estimated Location)[reference:57]
**User Value:** While SG BusLeh offers this[reference:58], very few apps do it well. Show the **exact real-time location** of each approaching bus on an interactive map, so users can see whether the bus is stuck in traffic or just around the corner.

### Feature 4: "ERP-Aware Route Costing"
**APIs Used:** ERP Rates[reference:59]+ Estimated Travel Times
**User Value:** For users considering driving or taking a taxi during peak hours, the app displays the **total cost** including ERP charges for different routes and times. This helps commuters make informed "drive vs public transport" decisions based on real-time ERP rates[reference:60].

### Feature 5: "Park & Ride Planner"
**APIs Used:** Carpark Availability[reference:61]+ Bus Arrival v2 + Bus Routes
**User Value:** For motorists who want to park and switch to public transport, the app shows nearby car parks with **real-time availability** and suggests the best bus/MRT connection from the carpark to the destination. Solves the "where to park" anxiety[reference:62].

### Feature 6: "Taxi Stand Finder + Availability"
**APIs Used:** Taxi Availability[reference:63]
**User Value:** Shows real-time taxi availability by region[reference:64], helping users decide whether to walk to a taxi stand or book a ride-hail. Combined with bus arrival data, users can compare "wait for bus" vs "walk to taxi stand" options side-by-side.

### Feature 7: "Traffic Camera Route Preview"
**APIs Used:** Traffic Images[reference:65][reference:66]
**User Value:** Before starting a journey that involves road travel (taxi, private hire, or even bus on congested roads), users can view **live traffic camera images** along the route[reference:67]. This visual confirmation helps users anticipate delays and choose alternative routes[reference:68].

### Feature 8: "Disruption Command Centre" – Real-Time Alternative Routing During MRT Disruptions
**APIs Used:** Train Service Alerts[reference:69]+ Bus Arrival v2 + Bus Routes + Bus Stops
**User Value:** When an MRT disruption occurs, the app automatically:
- Pushes an alert with the disruption details[reference:70]
- Suggests alternative bus routes that bypass the affected stations
- Shows real-time bus arrivals for those alternative services
- Provides step-by-step navigation for the new route

This addresses the "fragmented alerts" pain point identified in commuter research[reference:71].


## Summary: Why This New App Would Stand Out

The Singapore public transport app market is crowded, but **no single app** currently delivers on all fronts. The official MyTransport.SG app suffers from accuracy and stability issues[reference:72][reference:73]. Third-party apps like SG BusLeh and Citymapper excel in specific areas but lack deep integration across the full LTA DataMall dataset[reference:74].

**This new app would stand out by:**

1. **Being the most accurate** – by implementing smart ETA calibration and caching strategies to smooth out API inconsistencies.
2. **Being the most comprehensive** – uniquely combining **all** LTA DataMall datasets (bus, train, taxi, carpark, ERP, traffic cameras, alerts) into one seamless experience[reference:75].
3. **Being the most proactive** – with disruption command centre, crowdedness prediction, and rain-adaptive routing.
4. **Being the most transparent** – showing users the "cost vs time" trade-offs with real ERP and taxi availability data.

In short: **one app to rule them all**—accurate, comprehensive, proactive, and transparent. That is the gap in the market today.