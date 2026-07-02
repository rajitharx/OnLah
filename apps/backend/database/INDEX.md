# OnLah Database Files Index

Complete guide to all database-related files and their purposes.

## Files Overview

### Core Schema Files

| File | Purpose | Size |
|------|---------|------|
| **schema.sql** | Complete PostgreSQL schema with all tables, indexes, views, functions, and triggers | ~1000 lines |
| **extensions.sql** | PostgreSQL extensions required for geographic queries (earthdistance, cube) | ~20 lines |
| **setup.sh** | Automated setup script for database initialization | ~80 lines |

### Documentation

| File | Purpose | Audience |
|------|---------|----------|
| **README.md** | Comprehensive database documentation covering setup, schema design, maintenance, troubleshooting | Backend engineers, DevOps |
| **QUERIES_REFERENCE.md** | Common SQL queries and patterns for API development | Backend engineers |
| **INDEX.md** | This file - overview of all database files | Everyone |

### Data Files

| File | Purpose | Use Case |
|------|---------|----------|
| **seed-data.sql** | Sample data for development/testing - demonstrates schema structure | Local development, testing |
| **docker-compose.yml** | Docker Compose configuration for quick local PostgreSQL setup with sample data | Local development |

---

## Quick Start Guide

### 1. Local Development (Docker)
Fastest way to get started:

```bash
cd backend/database
docker-compose up -d
```

This will:
- Start PostgreSQL 15 on port 5432
- Initialize database with schema
- Load sample data
- Start Adminer UI on http://localhost:8080

### 2. Production/Manual Setup
For environments without Docker:

```bash
cd backend/database
chmod +x setup.sh
./setup.sh
```

Follow the prompts to configure your database connection.

### 3. Update Your Application
Edit `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=5432;Database=onlah;User Id=postgres;Password=***;Pooling=true;Maximum Pool Size=20;"
  }
}
```

---

## Schema Architecture

### Tables (7 core tables)

```
bus_stops                    (5K records)  ← LTA BusStops API cache
bus_routes                   (60K records) ← LTA BusRoutes API cache
bus_services                 (600 records) ← LTA BusServices API cache
train_lines                  (7 records)   ← MRT/LRT lines
train_stations               (180 records) ← MRT/LRT stations
train_line_stations          (Junction)    ← Many-to-many mapping
sync_metadata                (5 records)   ← Data freshness tracking
```

### Key Relationships

```
bus_stops
  ↑
  └─→ bus_routes (FK: bus_stop_code)
      └─→ bus_services (FK: service_no)

train_lines
  ↓
train_line_stations (Junction)
  ↓
train_stations
```

### Geographic Indexes

All tables with location data use GIST indexes:
- `bus_stops`: Location queries (find nearby stops)
- `train_stations`: Location queries (find nearby stations)

---

## Data Refresh Strategy

### Automatic Syncs (via backend jobs)

| Source | Frequency | Endpoint | Records | Purpose |
|--------|-----------|----------|---------|---------|
| Bus Stops | Weekly | LTA BusStops API | ~5,000 | Stop locations, metadata |
| Bus Routes | Weekly | LTA BusRoutes API | ~60,000 | Route sequencing, hours |
| Bus Services | Weekly | LTA BusServices API | ~600 | Service types, flags |
| Train Lines | Monthly | Manual/LTA | ~7 | Line definitions |
| Train Stations | Monthly | Manual/LTA | ~180 | Station locations |

### Real-Time (NOT persisted in v1)

| Source | Frequency | Purpose |
|--------|-----------|---------|
| Bus Arrivals | Every 20s | Live ETA from LTA (mobile client call) |
| Train Alerts | Every 2 min | Disruption status from LTA (mobile client call) |

### Sync Metadata

All syncs are tracked in `sync_metadata` table:
- Last sync timestamp
- Status (success/failed)
- Error messages
- Record count

Monitor with:
```sql
SELECT * FROM onlah.sync_metadata;
```

---

## Views & Functions

### Views (3 helper views)

1. **v_bus_service_routes**
   - Service info + route statistics (num_directions, num_stops, timestamps)
   - Use for dashboard/analytics

2. **v_bus_stops_geographic**
   - All stops with earth_distance format coordinates
   - Use for geographic queries

3. **v_train_line_stations_detail**
   - Flattened view of lines with stations and sequence
   - Use for mapping disruptions

### Functions (3 reusable functions)

1. **find_nearby_stops(lat, lon, radius_m DEFAULT 500)**
   - Returns stops within radius sorted by distance
   - Use for discovery screen

2. **get_services_for_stop(bus_stop_code)**
   - Returns all services at a stop with direction count
   - Use for arrivals screen

3. **update_sync_metadata(source, status, records, error_msg)**
   - Updates sync tracking table
   - Use in backend sync jobs

---

## Performance Features

### Indexes (10 total)

- **Geographic (GIST):** 3 indexes on lat/lon for fast nearby queries
- **Unique constraints:** 6 for primary lookups (bus_stop_code, service_no, etc.)
- **Composite:** 2 for frequent join patterns (service_no + stop_code, line_id + station_id)

### Query Performance

| Query | Expected Time |
|-------|---|
| Find nearby stops (500m) | <10ms |
| Get services at stop | <5ms |
| Get route sequence | <20ms |
| Full table scan (5K stops) | <100ms |

### Maintenance

- Triggers auto-update `updated_at` timestamps
- Foreign key cascades prevent orphaned records
- Transactions ensure data consistency during syncs

---

## Monitoring & Maintenance

### Health Checks

```sql
-- Check all tables exist
SELECT count(*) FROM information_schema.tables
WHERE table_schema = 'onlah';

-- Check data freshness
SELECT data_source, last_sync_at
FROM onlah.sync_metadata
ORDER BY last_sync_at DESC;

-- Check for sync failures
SELECT * FROM onlah.sync_metadata
WHERE last_sync_status = 'failed';
```

### Backup Strategy

```bash
# Full backup
pg_dump -h localhost -U postgres onlah > onlah_backup.sql

# Restore
psql -h localhost -U postgres onlah < onlah_backup.sql
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Geographic queries slow | Run `ANALYZE onlah.bus_stops` |
| Disk usage growing | Run `VACUUM FULL ANALYZE` |
| Earthdistance not found | Run `CREATE EXTENSION earthdistance CASCADE` |
| Referential integrity error | Check sync_metadata for failed syncs |

---

## Integration with .NET Backend

### Current State (v1)

- Entity Framework Core DbContext uses PostgreSQL provider
- Only `BusStop` entity is currently mapped
- Uses `Database.EnsureCreatedAsync()` for schema initialization

### Next Steps (v1 → v2)

1. Add EF Core entity mappings for:
   - BusRoute
   - BusService
   - TrainLine
   - TrainStation

2. Create EF Core migrations:
   ```bash
   dotnet ef migrations add AddRouteEntities
   dotnet ef database update
   ```

3. Implement LTA API sync jobs:
   - Weekly background job for bus stops
   - Weekly background job for routes/services
   - Hosted service in Program.cs

---

## File Descriptions

### schema.sql (~1000 lines)

**Complete database schema containing:**

1. **Tables section (rows 15–120)**
   - bus_stops (5-digit codes, location data)
   - bus_routes (sequencing, operating hours)
   - bus_services (service metadata, flags)
   - train_lines (line definitions)
   - train_stations (station locations)
   - train_line_stations (junction table)
   - sync_metadata (refresh tracking)

2. **Indexes section (rows 125–160)**
   - GIST geographic indexes
   - B-tree primary/foreign key indexes
   - Composite indexes for common queries
   - UNIQUE constraints

3. **Views section (rows 165–220)**
   - Service route aggregation
   - Geographic coordinate formatting
   - Train line-station detail view

4. **Functions section (rows 225–300)**
   - `find_nearby_stops()` - geographic search
   - `get_services_for_stop()` - service lookup
   - `update_sync_metadata()` - tracking updates

5. **Triggers section (rows 305–370)**
   - Auto-update `updated_at` on every table

6. **Documentation (rows 375–500)**
   - Inline comments for each table/column
   - Refresh strategy notes
   - Performance considerations

### setup.sh (~80 lines)

**Database initialization script with:**
- Connection configuration
- Extension enablement
- Schema creation
- Verification steps
- User-friendly prompts

### docker-compose.yml (~40 lines)

**Local development environment:**
- PostgreSQL 15 Alpine
- Persistent volume for data
- Sample data initialization
- Adminer UI for browsing
- Health checks

### README.md (~800 lines)

**Comprehensive documentation:**
- Quick start guide
- Schema overview with column descriptions
- Data synchronization strategy
- Performance tuning
- Backup procedures
- Troubleshooting guide
- Development notes
- Migration path for v2/v3

### QUERIES_REFERENCE.md (~400 lines)

**SQL query patterns:**
- Bus stop queries
- Service & route queries
- Train line queries
- Sync monitoring
- Analytics queries
- Performance queries
- Real API use cases

### seed-data.sql (~150 lines)

**Sample data for testing:**
- 7 bus stops (Sengkang area)
- 8 bus services
- 14 bus routes (Service 15, 175 examples)
- 7 train lines
- 7 train stations
- Relationship mappings

---

## Getting Help

### Before Implementation
1. Read [README.md](./README.md) - comprehensive reference
2. Check [QUERIES_REFERENCE.md](./QUERIES_REFERENCE.md) for examples
3. Review [schema.sql](./schema.sql) comments for details

### Troubleshooting
1. Check `sync_metadata` table for freshness/errors
2. Verify indexes with `pg_stat_user_indexes`
3. Run `ANALYZE` to update query planner statistics
4. Review PostgreSQL logs for constraint violations

### Adding New Features
1. Modify schema.sql with new tables/columns
2. Create EF Core entities and DbContext mappings
3. Add migrations: `dotnet ef migrations add [name]`
4. Update sync jobs if adding new cached data source

---

## Key Design Decisions

1. **Geographic Queries:** Using PostgreSQL's earthdistance (Great Circle distance) for accuracy and performance

2. **No Bus Arrival Persistence:** Live LTA API calls only; no caching of ETA data to ensure accuracy

3. **Weekly Static Refreshes:** Bus stops/routes/services refreshed weekly (not real-time) to balance freshness with API rate limits

4. **Sync Metadata Tracking:** Every sync records status, timestamp, and error details for monitoring

5. **Foreign Key Cascades:** Deleting a stop cascades to routes (prevents orphaned data)

6. **Time Format (HH:MM):** Consistent time format for operating hours (e.g., "05:30", "23:00")

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Jun 2026 | Initial schema for v1 (bus stops, routes, services, trains) |

---

## Contact & Contributions

For questions or improvements:
- Check the README.md troubleshooting section
- Review schema.sql inline comments
- Run QUERIES_REFERENCE.md examples for validation

Last Updated: June 2026
