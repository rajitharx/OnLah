# LTA DataMall API Reference

> Source: LTA DataMall API User Guide v6.8 (21 Apr 2026)  
> Scope: APIs relevant to **OnLah** — bus arrivals, stops, routes, services, MRT alerts, crowd density

---

## Authentication

All API calls require an `AccountKey` header.

```http
GET https://datamall2.mytransport.sg/ltaodataservice/<endpoint>
Headers:
  AccountKey: <your-account-key>
  Accept: application/json        # default; use application/atom+xml for XML
```

- Method: **GET only**
- Base URL: `https://datamall2.mytransport.sg/ltaodataservice`
- Register for an AccountKey at the LTA DataMall portal

---

## Pagination

All APIs except Bus Arrival, Train Service Alerts, Passenger Volume, and Taxi Stands return **500 records per call**.

To paginate, append `?$skip=N`:

```
GET /BusRoutes          → records 1–500
GET /BusRoutes?$skip=500  → records 501–1000
GET /BusRoutes?$skip=1000 → records 1001–1500
```

Keep calling with increasing `$skip` until the response returns fewer than 500 records (signals end of dataset).

---

## APIs Used by OnLah v1

### 1. Bus Arrival (v3) ⭐ Primary

**Endpoint:** `GET /v3/BusArrival`  
**Update Frequency:** Every 20 seconds  
**Pagination:** Not applicable — scoped to one bus stop per call

#### Request Parameters

| Parameter | Description | Mandatory | Example |
|-----------|-------------|-----------|---------|
| `BusStopCode` | 5-digit bus stop reference code | **Yes** | `83139` |
| `ServiceNo` | Filter to a specific bus service | No | `15` |

#### Response Structure

```json
{
  "odata.metadata": "...",
  "BusStopCode": "83139",
  "Services": [
    {
      "ServiceNo": "15",
      "Operator": "GAS",
      "NextBus": { ... },
      "NextBus2": { ... },
      "NextBus3": { ... }
    }
  ]
}
```

#### Bus-Level Attributes (NextBus / NextBus2 / NextBus3)

| Attribute | Description | Values / Example |
|-----------|-------------|-----------------|
| `OriginCode` | First bus stop of this service | `77009` |
| `DestinationCode` | Last bus stop (terminus) of this service | `77131` |
| `EstimatedArrival` | ETA in ISO 8601, GMT+8 | `2024-08-14T16:41:48+08:00` |
| `Monitored` | `1` = live GPS tracking; `0` = schedule-based | `1` |
| `Latitude` | Current bus latitude (empty if unmonitored) | `1.3154918` |
| `Longitude` | Current bus longitude | `103.9059125` |
| `VisitNumber` | Which visit this bus is making at this stop | `1` |
| `Load` | Crowd level: `SEA` / `SDA` / `LSD` | `SEA` |
| `Feature` | `WAB` = wheelchair accessible; blank = not | `WAB` |
| `Type` | `SD` = single deck; `DD` = double deck; `BD` = bendy | `SD` |

#### Operator Codes

| Code | Operator |
|------|----------|
| `SBST` | SBS Transit |
| `SMRT` | SMRT Corporation |
| `TTS` | Tower Transit Singapore |
| `GAS` | Go Ahead Singapore |

#### Load Values Explained

| Value | Meaning | Recommended UI Colour |
|-------|---------|----------------------|
| `SEA` | Seats Available | 🟢 Green |
| `SDA` | Standing Available | 🟡 Amber |
| `LSD` | Limited Standing | 🔴 Red |

#### Critical Implementation Notes

**Empty response = bus not in service OR API maintenance.** The API returns nothing (not even attribute tags) when buses are not operating. Do not show an error — check against Bus Routes to determine which advisory to show:

| Condition | Data Available | Display |
|-----------|---------------|---------|
| Bus in operation | Yes | Show ETAs normally |
| Bus in operation | No | "No Est. Available" |
| Bus not in operation | No | "Not In Operation" |
| Bus not in operation | Yes | Show ETAs (early/late service) |

**Always display arrival data if present**, regardless of scheduled operating hours — buses may run slightly before or after their timetable.

**ETA Rounding Rules** (round down to nearest minute):
- `3:49` → display `"3 min"`
- `0:59` → display `"Arr"`

**NextBus2 / NextBus3 may be empty** — all attributes will be blank strings if only one bus remains in service.

**`Monitored: 0` means schedule-based ETA** — Latitude/Longitude will be `"0.0"`. Do not attempt to plot these on a map.

#### Sample Call

```
GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139
Headers: AccountKey: <your-key>
```

---

### 2. Bus Stops ⭐ Primary

**Endpoint:** `GET /BusStops`  
**Update Frequency:** Ad hoc (static reference data — sync periodically, not per request)  
**Pagination:** 500 records per call, use `$skip` to retrieve all ~5,000 stops

#### Request Parameters

| Parameter | Description | Mandatory | Example |
|-----------|-------------|-----------|---------|
| `BusStopCode` | Filter to a specific stop | No | `01012` |

#### Response Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `BusStopCode` | Unique 5-digit identifier | `01012` |
| `RoadName` | Road where stop is located | `Victoria St` |
| `Description` | Landmark / name to aid identification | `Hotel Grand Pacific` |
| `Latitude` | Stop coordinates | `1.29685` |
| `Longitude` | Stop coordinates | `103.853` |

#### Usage in OnLah

Use this to build a local database of all bus stops (for nearby stop discovery via GPS). Fetch all pages at app launch or via background sync. Store locally — do not call per-user-request.

```
Fetch all stops:
GET /BusStops           → first 500
GET /BusStops?$skip=500 → next 500
... continue until response has < 500 records
```

---

### 3. Bus Routes

**Endpoint:** `GET /BusRoutes`  
**Update Frequency:** Ad hoc (static reference data)  
**Pagination:** 500 records per call — dataset is large, requires many pages

#### Response Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `ServiceNo` | Bus service number | `107M` |
| `Operator` | Operator code | `SBST` |
| `Direction` | `1` or `2`; loop services have only `1` | `1` |
| `StopSequence` | Ordinal position of this stop in the route | `28` |
| `BusStopCode` | 5-digit stop code | `01219` |
| `Distance` | Distance from origin to this stop (km) | `10.3` |
| `WD_FirstBus` | Weekday first bus (HHMM) | `2025` |
| `WD_LastBus` | Weekday last bus (HHMM) | `2352` |
| `SAT_FirstBus` | Saturday first bus | `1427` |
| `SAT_LastBus` | Saturday last bus | `2349` |
| `SUN_FirstBus` | Sunday first bus | `0620` |
| `SUN_LastBus` | Sunday last bus | `2349` |

#### Usage in OnLah

Required for the **"Not In Operation" advisement logic** — cross-reference `WD_FirstBus`/`WD_LastBus` (and SAT/SUN variants) with current time and day to determine if a service is supposed to be running. Store locally.

---

### 4. Bus Services

**Endpoint:** `GET /BusServices`  
**Update Frequency:** Ad hoc (static reference data)  
**Pagination:** 500 records per call

#### Request Parameters

| Parameter | Description | Mandatory | Example |
|-----------|-------------|-----------|---------|
| `ServiceNo` | Filter to a specific service | No | `107M` |

#### Response Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `ServiceNo` | Bus service number | `107M` |
| `Operator` | Operator code | `SBST` |
| `Direction` | `1` or `2` | `1` |
| `Category` | Service type: `TRUNK`, `FEEDER`, `EXPRESS`, `INDUSTRIAL`, `TOWNLINK`, etc. | `TRUNK` |
| `OriginCode` | First stop code | `64009` |
| `DestinationCode` | Last stop code | `64009` |
| `AM_Peak_Freq` | Frequency 0630–0830H (minutes range) | `14-17` |
| `AM_Offpeak_Freq` | Frequency 0831–1659H (minutes range) | `10-16` |
| `PM_Peak_Freq` | Frequency 1700–1900H (minutes range) | `12-15` |
| `PM_Offpeak_Freq` | Frequency after 1900H (minutes range) | `12-15` |
| `LoopDesc` | Loop point location, empty if not a loop service | `Raffles Blvd` |

---

### 5. Train Service Alerts ⭐ Primary

**Endpoint:** `GET /TrainServiceAlerts`  
**Update Frequency:** Ad hoc (published by LTA during disruptions)  
**Pagination:** Not applicable  
**Parameters:** None

#### Response Attributes

| Attribute | Description | Values / Example |
|-----------|-------------|-----------------|
| `Status` | Overall service state | `1` = Normal / Minor Delays; `2` = Disrupted / Major Delays |
| `Line` | Affected line code | `NEL`, `NSL`, `EWL`, `CCL`, `DTL`, `TEL`, `BPL`, `STL`, `PTL` |
| `Direction` | Direction of disruption | `Both` or `"towards Punggol"` |
| `Stations` | Comma-separated affected station codes | `NE1,NE3,NE4,NE5,NE6` |
| `FreePublicBus` | Stations with free public bus boarding | `NE1,NE3,NE4,NE5` or `"Free bus service island wide"` |
| `FreeMRTShuttle` | Stations with free MRT shuttle | `NE1,NE3,NE4` |
| `MRTShuttleDirection` | Shuttle direction | `Both` or `"towards Punggol"` |
| `Message.Content` | Full travel advisory text from LTA | `"1710hrs: NEL – No train service between..."` |
| `Message.CreatedDate` | When advisory was published | `2017-12-01 17:54:21` |

#### Line Codes

| Code | Line |
|------|------|
| `EWL` | East West Line (incl. Changi Extension: Expo, Changi Airport) |
| `NSL` | North South Line |
| `NEL` | North East Line |
| `CCL` | Circle Line (incl. Extension: BayFront, Marina Bay) |
| `DTL` | Downtown Line |
| `TEL` | Thomson-East Coast Line |
| `BPL` | Bukit Panjang LRT |
| `STL` | Sengkang LRT |
| `PTL` | Punggol LRT |

#### Implementation Notes for OnLah

- When `Status = 1`: show a "Normal service" badge or suppress the alert UI entirely
- When `Status = 2`: surface the disruption panel — show affected `Line`, `Direction`, `Stations`, and `Message.Content`
- Each disrupted line is returned as a **separate cluster** in the same API response — iterate all clusters
- `FreePublicBus` and `FreeMRTShuttle` fields help users understand alternate options without needing full rerouting logic
- This API is **ad hoc** — poll at a reasonable interval (e.g. every 2 minutes during peak hours) or use a cached backend layer

---

### 6. Station Crowd Density Real Time

**Endpoint:** `GET /PCDRealTime`  
**Update Frequency:** Every 10 minutes  
**Note:** Data is for MRT/LRT platforms, **not buses**. Useful for MRT context in OnLah.

#### Request Parameters

| Parameter | Description | Mandatory | Example |
|-----------|-------------|-----------|---------|
| `TrainLine` | Train line code (see list below) | **Yes** | `EWL` |

#### Supported Train Line Codes

`CCL`, `CEL`, `CGL`, `DTL`, `EWL`, `NEL`, `NSL`, `BPL`, `SLRT`, `PLRT`, `TEL`

#### Response Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `Station` | Station code | `EW13` |
| `StartTime` | Interval start | `2021-09-15T09:40:00+08:00` |
| `EndTime` | Interval end | `2021-09-15T09:50:00+08:00` |
| `CrowdLevel` | `l` = low, `m` = moderate, `h` = high, `NA` | `l` |

> ⚠️ **Important:** This data is **real-time** for MRT platforms only. It is NOT the same as bus crowd data.  
> Bus crowd data comes from the `Load` field in the **Bus Arrival API** — no separate call needed.

---

### 7. Station Crowd Density Forecast

**Endpoint:** `GET /PCDForecast`  
**Update Frequency:** Every 24 hours (forecasts, not live)  
**Note:** Deferred to v2 of OnLah — MRT crowd forecast is historical pattern, not real-time.

#### Request Parameters

Same as Real Time — `TrainLine` (mandatory).

#### Response Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `Date` | Midnight of the forecast date | `2021-09-15T00:00:00+08:00` |
| `Station` | Station code | `NS1` |
| `Start` | Start of the 30-min interval | `2021-09-15T00:00:00+08:00` |
| `CrowdLevel` | `l` / `m` / `h` / `NA` | `l` |

---

## API Quick Reference Table

| API | Endpoint | Update Freq | Pagination | OnLah v1? |
|-----|----------|-------------|------------|-----------|
| Bus Arrival v3 | `/v3/BusArrival` | 20 sec | No (per-stop) | ✅ Core |
| Bus Stops | `/BusStops` | Ad hoc | 500/page | ✅ Core |
| Bus Routes | `/BusRoutes` | Ad hoc | 500/page | ✅ Supporting |
| Bus Services | `/BusServices` | Ad hoc | 500/page | ✅ Supporting |
| Train Service Alerts | `/TrainServiceAlerts` | Ad hoc | No | ✅ Core |
| Station Crowd Density RT | `/PCDRealTime` | 10 min | No | 🔜 v2 |
| Station Crowd Density Forecast | `/PCDForecast` | 24 hrs | No | 🔜 v2 |
| Planned Bus Routes | `/PlannedBusRoutes` | Ad hoc | 500/page | 🔜 v2 |
| Facilities Maintenance | `/v2/FacilitiesMaintenance` | Ad hoc | 500/page | 🔜 v2 |

---

## Response Format Notes

- Default response format is **JSON**
- JSON responses are wrapped under `odata.metadata` + `value` array (for paginated APIs) or flat object (for Bus Arrival)
- Any attributes present in the feed but **not documented** in this guide should be **ignored**
- Timestamps are in **Singapore Standard Time (GMT+8)** — no timezone conversion needed

---

## Error & Edge Case Handling

| Scenario | Behaviour | How to Handle |
|----------|-----------|---------------|
| Bus not in service | Empty response (no JSON body) | Cross-check Bus Routes for operating hours; show "Not In Operation" |
| API under maintenance | Empty response | Show "No Est. Available" if bus should be operating |
| `Monitored: 0` | ETA is schedule-based, lat/long = `"0.0"` | Show schedule indicator; do not render bus on map |
| `NextBus2` / `NextBus3` empty | Last bus on road | Suppress empty slots in UI |
| `CrowdLevel: NA` | No data available for this station | Show neutral/grey state |
| Train disruption, `Status: 1` | Minor delays or normal | Suppress disruption banner |
| Train disruption, `Status: 2` | Major disruption | Show full disruption card |

---

## Data Freshness Strategy for OnLah

| Data Type | Cache Strategy |
|-----------|---------------|
| Bus Arrivals | Never cache — always live (20s update) |
| Bus Stops | Local DB, refresh weekly or on-demand |
| Bus Routes | Local DB, refresh weekly or on-demand |
| Bus Services | Local DB, refresh weekly or on-demand |
| Train Service Alerts | Poll every 2 min; cache last response with timestamp |
| Station Crowd RT | Poll every 10 min per line requested |

---

*Document version: LTA DataMall v6.8 — 21 Apr 2026*
