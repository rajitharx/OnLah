# OnLah Database Schema & Setup

This directory contains the PostgreSQL database schema and setup scripts for the OnLah transit application.

## Quick Start

### Prerequisites

- PostgreSQL 13+ (14+ recommended for best performance)
- `psql` CLI tool installed
- Network access to your PostgreSQL server

### Setup

1. **Set environment variables** (optional; defaults provided):
   ```bash
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_NAME=onlah
   export DB_USER=postgres
   ```

2. **Run the setup script**:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

   The script will:
   - Verify PostgreSQL connectivity
   - Create the database (if not exists)
   - Enable required extensions (`earthdistance`, `cube`)
   - Execute the full schema
   - Verify table creation

3. **Update your connection string** in `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Port=5432;Database=onlah;User Id=postgres;Password=<your-password>"
     }
   }
   ```

4. **Test the connection**:
   ```bash
   psql -h localhost -p 5432 -U postgres -d onlah -c "SELECT COUNT(*) FROM onlah.bus_stops;"
   ```

---

## Schema Overview

### Core Tables

#### `bus_stops`
Caches LTA BusStops API data. Primary source for stop metadata and coordinates.

**Columns:**
- `bus_stop_code` (VARCHAR(5)) - Unique 5-digit LTA stop code; **PRIMARY KEY**
- `road_name` (VARCHAR(100)) - Street/road name
- `description` (VARCHAR(200)) - Stop description (e.g., "Sengkang Stadium")
- `latitude` (DECIMAL(10,8)) - Geographic latitude (WGS84)
- `longitude` (DECIMAL(11,8)) - Geographic longitude (WGS84)
- `created_at`, `updated_at` - Timestamps for audit

**Indexes:**
- GIST index on `(latitude, longitude)` for fast geographic queries
- B-tree index on `description` for text search

**Refresh Schedule:** Weekly (Sunday 2:00 AM UTC+8)

---

#### `bus_routes`
Caches LTA BusRoutes API data. Provides route sequencing, operating hours, and distance information.

**Columns:**
- `route_id` (SERIAL) - **PRIMARY KEY**
- `bus_route_code` (VARCHAR(10)) - Unique route identifier
- `service_no` (VARCHAR(10)) - Bus service number (e.g., "15", "165X")
- `operator` (VARCHAR(10)) - Operator code: `SBST`, `SMRT`, `TTS`, `GAS`
- `direction` (INT) - 1 or 2 (outbound/inbound)
- `stop_sequence` (INT) - Sequential position in route
- `bus_stop_code` (VARCHAR(5)) - **FOREIGN KEY** → `bus_stops`
- `distance` (DECIMAL(8,2)) - Distance in km from route start
- `wd_first_bus`, `wd_last_bus` (VARCHAR(5)) - Weekday first/last bus time (HH:MM)
- `sat_first_bus`, `sat_last_bus` (VARCHAR(5)) - Saturday first/last bus time
- `sun_first_bus`, `sun_last_bus` (VARCHAR(5)) - Sunday first/last bus time
- `created_at`, `updated_at` - Timestamps

**Indexes:**
- Unique index on `bus_route_code`
- Composite index on `(service_no, bus_stop_code)` for fast service lookups
- Index on `(service_no, direction)` for route discovery

**Refresh Schedule:** Weekly (Sunday 2:15 AM UTC+8)

---

#### `bus_services`
Caches LTA BusServices API data. Stores service-level metadata for filtering and categorization.

**Columns:**
- `bus_service_id` (SERIAL) - **PRIMARY KEY**
- `service_no` (VARCHAR(10)) - **UNIQUE** bus service number
- `operator` (VARCHAR(10)) - Operator code
- `service_type` (VARCHAR(5)) - Service classification (e.g., "PT" for public transport)
- `is_express` (BOOLEAN) - Skips certain stops
- `is_night` (BOOLEAN) - Midnight hour service
- `is_free_tier` (BOOLEAN) - Free-tier service (e.g., Community Shuttle)
- `created_at`, `updated_at` - Timestamps

**Indexes:**
- Unique index on `service_no`
- Index on `operator`
- Index on `service_type`

**Refresh Schedule:** Weekly (Sunday 2:30 AM UTC+8)

---

#### `train_lines`
Defines Singapore MRT/LRT lines for disruption alert mapping.

**Columns:**
- `line_id` (SERIAL) - **PRIMARY KEY**
- `line_code` (VARCHAR(10)) - **UNIQUE** line code (e.g., "NS", "EW")
- `line_name` (VARCHAR(100)) - Full line name (e.g., "North-South Line")
- `line_abbreviation` (VARCHAR(5)) - Short code (e.g., "NS")
- `color` (VARCHAR(7)) - Hex color for UI display (e.g., "FF0000")
- `created_at`, `updated_at` - Timestamps

**Refresh Schedule:** Monthly (first Sunday at 2:45 AM UTC+8)

---

#### `train_stations`
Defines Singapore MRT/LRT stations with geographic coordinates.

**Columns:**
- `station_id` (SERIAL) - **PRIMARY KEY**
- `station_code` (VARCHAR(10)) - **UNIQUE** station code
- `station_name` (VARCHAR(100)) - Full station name
- `latitude` (DECIMAL(10,8)) - Geographic latitude (WGS84)
- `longitude` (DECIMAL(11,8)) - Geographic longitude (WGS84)
- `created_at`, `updated_at` - Timestamps

**Indexes:**
- Unique index on `station_code`
- GIST index on `(latitude, longitude)` for geographic queries

---

#### `train_line_stations`
Junction table mapping stations to lines (many-to-many relationship).

**Columns:**
- `line_station_id` (SERIAL) - **PRIMARY KEY**
- `line_id` (INT) - **FOREIGN KEY** → `train_lines`
- `station_id` (INT) - **FOREIGN KEY** → `train_stations`
- `station_sequence` (INT) - Order of station on the line
- Unique constraint on `(line_id, station_id)`

---

#### `sync_metadata`
Tracks data synchronization status and freshness for all cached data sources.

**Columns:**
- `sync_id` (SERIAL) - **PRIMARY KEY**
- `data_source` (VARCHAR(50)) - **UNIQUE** source identifier
  - Valid values: `bus_stops`, `bus_routes`, `bus_services`, `train_lines`, `train_stations`
- `last_sync_at` (TIMESTAMPTZ) - Timestamp of last successful sync
- `last_sync_status` (VARCHAR(20)) - Status: `pending`, `in_progress`, `success`, `failed`
- `error_message` (TEXT) - Error details if sync failed
- `records_synced` (INT) - Number of records synced
- `created_at`, `updated_at` - Timestamps

**Purpose:** Monitor data freshness and troubleshoot sync issues.

---

### Views

#### `v_bus_service_routes`
Aggregates service information with route statistics.

**Returns:**
- `service_no`, `operator`, `service_type`, `is_express`, `is_night`
- `num_directions` - Count of directional routes
- `num_stops` - Total stops served
- `first_route_added`, `last_route_updated` - Timing info

**Use case:** Dashboard queries for service coverage analysis.

---

#### `v_bus_stops_geographic`
Provides geographic coordinates with earth_distance format for queries.

**Returns:**
- All bus stop details + `location` (earth_distance format)

---

#### `v_train_line_stations_detail`
Flattened view of train lines with all stations and sequence information.

**Returns:**
- Line info + Station info + `station_sequence`

**Use case:** Mapping train disruptions to affected stations.

---

### Stored Functions

#### `find_nearby_stops(latitude, longitude, radius_meters DEFAULT 500)`

Finds bus stops within a specified radius using earth_distance calculations.

**Parameters:**
- `latitude` (DECIMAL) - User's latitude (WGS84)
- `longitude` (DECIMAL) - User's longitude (WGS84)
- `radius_meters` (INT) - Search radius in meters (default: 500)

**Returns:**
```
bus_stop_code, road_name, description, latitude, longitude, distance_meters
```

**Example:**
```sql
SELECT * FROM find_nearby_stops(1.3293, 103.8609, 500);
```

---

#### `get_services_for_stop(bus_stop_code)`

Returns all bus services operating at a specific stop.

**Parameters:**
- `bus_stop_code` (VARCHAR(5)) - 5-digit stop code

**Returns:**
```
service_no, operator, service_type, is_express, is_night, num_directions
```

**Example:**
```sql
SELECT * FROM get_services_for_stop('83139');
```

---

#### `update_sync_metadata(data_source, status, records_synced, error_message)`

Updates synchronization status for a data source.

**Parameters:**
- `data_source` (VARCHAR(50)) - Source identifier
- `status` (VARCHAR(20)) - `pending`, `in_progress`, `success`, or `failed`
- `records_synced` (INT, optional) - Number of records synced
- `error_message` (TEXT, optional) - Error details

**Example:**
```sql
SELECT update_sync_metadata('bus_stops', 'success', 5090, NULL);
```

---

## Data Synchronization Strategy

### Refresh Schedule

| Data Source | Frequency | Time (UTC+8) | Purpose |
|---|---|---|---|
| Bus Stops | Weekly | Sunday 2:00 AM | Static stop locations and metadata |
| Bus Routes | Weekly | Sunday 2:15 AM | Route sequencing and operating hours |
| Bus Services | Weekly | Sunday 2:30 AM | Service metadata (express, night, etc.) |
| Train Lines | Monthly | 1st Sun 2:45 AM | Line definitions and colors |
| Train Stations | Monthly | 1st Sun 2:45 AM | Station locations and names |
| **Train Alerts** | **Every 2 min** | **Real-time** | **NOT persisted in v1** |

### Bus Arrival Data

**⚠️ Bus arrivals are NOT cached.** They are live LTA API calls:
- Fetched on-demand by mobile client
- Every 20 seconds for active stop view
- Never persisted to database
- ETA accuracy is maintained by LTA

### Implementation Notes

1. **Batch Syncing:** All LTA API calls use pagination with `$skip=N` (returns 500 records per request)
2. **Transaction Safety:** Use database transactions to ensure all-or-nothing updates
3. **Error Handling:** Log sync failures to `sync_metadata.error_message` for monitoring
4. **Idempotency:** Syncs can safely be re-run (use UPSERT patterns or truncate+insert)

---

## Geographic Queries

The schema uses PostgreSQL's **earthdistance** extension for accurate distance calculations using the Great Circle formula.

### Example: Find nearby stops

```sql
SELECT
    bus_stop_code,
    road_name,
    ROUND(earth_distance(
        ll_to_earth(1.3293, 103.8609),
        ll_to_earth(latitude, longitude)
    ))::INT as distance_meters
FROM bus_stops
WHERE earth_distance(
    ll_to_earth(1.3293, 103.8609),
    ll_to_earth(latitude, longitude)
) <= 500
ORDER BY distance_meters;
```

Or use the pre-built function:

```sql
SELECT * FROM find_nearby_stops(1.3293, 103.8609, 500);
```

---

## Performance Considerations

### Indexes

All high-cardinality columns have B-tree indexes:
- Bus stop code lookups: O(log N)
- Service number searches: O(log N)
- Operator filters: O(log N)

Geographic queries use GIST indexes for sub-millisecond responses on 5,000+ stops.

### Connection Pooling

Configure in your application:
- **Min pool size:** 5
- **Max pool size:** 20
- **Command timeout:** 30 seconds (for LTA sync operations)

### Query Optimization

- `sync_metadata` queries use indexes on `data_source` (UNIQUE, fastest)
- Service-to-stop lookups use composite index on `(service_no, bus_stop_code)`
- Geographic queries use GIST index + function evaluation (tuned for <500m radius)

---

## Maintenance

### Backup Strategy

Recommended backup schedule:
- **Daily backups** of the entire database (file-based or pg_dump)
- **Weekly full backups** with off-site replication
- **Retention:** 30 days of daily, 6 months of weekly

```bash
# Full backup
pg_dump -h localhost -U postgres onlah > onlah_backup_$(date +%Y%m%d).sql

# Restore
psql -h localhost -U postgres onlah < onlah_backup_20260101.sql
```

### Monitoring

Key metrics to monitor:
1. **Sync freshness:** `last_sync_at` for each data source (should be recent)
2. **Sync errors:** `last_sync_status = 'failed'` (should be none)
3. **Table sizes:** `bus_stops` should have ~5,000 records; `bus_routes` ~60,000
4. **Disk space:** Reserve at least 500MB for growth
5. **Connection count:** Monitor for connection leaks

### Troubleshooting

**Problem:** Sync fails with "permission denied"
```sql
-- Grant necessary permissions to app user
GRANT USAGE ON SCHEMA onlah TO onlah_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA onlah TO onlah_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA onlah TO onlah_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA onlah TO onlah_app;
```

**Problem:** Geographic queries are slow
```sql
-- Check if GIST index exists
SELECT * FROM pg_indexes WHERE indexname LIKE '%bus_stops_location%';

-- Recreate if missing
CREATE INDEX idx_bus_stops_location ON bus_stops USING GIST (
    ll_to_earth(latitude, longitude)
);
```

**Problem:** Earthdistance extension not found
```sql
-- Create extension with CASCADE (includes cube dependency)
CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;
```

---

## Integration with .NET Backend

The OnLah .NET API uses Entity Framework Core with PostgreSQL provider.

### Connection String (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=5432;Database=onlah;User Id=postgres;Password=***;Pooling=true;Maximum Pool Size=20;"
  }
}
```

### EF Core Migrations (if using)

```bash
# Initial migration (after schema created)
dotnet ef migrations add InitialCreate --project src/OnLah.Infrastructure --startup-project src/OnLah.Api

# Apply migrations
dotnet ef database update --project src/OnLah.Infrastructure --startup-project src/OnLah.Api
```

### DbContext Usage

The `OnLahDbContext` maps:
- `DbSet<BusStop>` → `bus_stops` table
- (Future: `DbSet<BusRoute>`, `DbSet<BusService>`, etc.)

---

## Development Notes

### Local Development Setup

1. **Install PostgreSQL** (via Homebrew on Mac):
   ```bash
   brew install postgresql@15
   brew services start postgresql@15
   ```

2. **Create development database**:
   ```bash
   createdb onlah
   ```

3. **Run schema setup**:
   ```bash
   ./setup.sh
   ```

4. **Verify**:
   ```bash
   psql -d onlah -c "SELECT COUNT(*) FROM onlah.bus_stops;"
   ```

### Testing

Pre-populate test data for integration tests:

```sql
-- Insert test bus stops
INSERT INTO onlah.bus_stops (bus_stop_code, road_name, description, latitude, longitude) VALUES
('83139', 'Sengkang Road', 'Sengkang Stadium', 1.39293, 103.8609),
('83109', 'Sengkang Road', 'Compassvale Rd', 1.38985, 103.86541);
```

---

## Migration Path (v1 → v2)

The current schema is optimized for **v1 features**. Future enhancements:

- **v2:** User accounts & server-synced favorites
  - Add `users` table with auth
  - Add `user_favorites` junction table
  - Add `user_audit_log` for activity tracking

- **v2:** ETA history for reliability scoring
  - Add `eta_history` table
  - Add `arrival_accuracy_metrics` for analytics

- **v3:** Full journey planning
  - Add `transfers` table for multi-modal journeys
  - Add `disruption_history` for analytics

The current schema design supports these extensions without breaking changes.

---

## References

- **LTA DataMall API:** See `LTA_DATAMALL_API.md` in project docs
- **PostgreSQL earthdistance:** https://www.postgresql.org/docs/current/earthdistance.html
- **Entity Framework Core:** https://docs.microsoft.com/en-us/ef/core/
- **PostgreSQL Performance Tuning:** https://wiki.postgresql.org/wiki/Performance_Optimization

---

**Last Updated:** June 2026 | **Schema Version:** 1.0.0
