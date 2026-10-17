# OnLah Database Queries Reference

Common SQL queries and patterns for the OnLah backend API development.

## Bus Stops

### Get a single bus stop by code
```sql
SELECT * FROM onlah.bus_stops WHERE bus_stop_code = '83139';
```

### Get all bus stops
```sql
SELECT * FROM onlah.bus_stops ORDER BY road_name, description;
```

### Count total bus stops
```sql
SELECT COUNT(*) as total_stops FROM onlah.bus_stops;
```

### Find nearby bus stops (within 500m)
```sql
SELECT * FROM onlah.find_nearby_stops(1.39293, 103.8609, 500)
ORDER BY distance_meters;
```

### Find nearby bus stops (within 1km)
```sql
SELECT * FROM onlah.find_nearby_stops(1.39293, 103.8609, 1000)
ORDER BY distance_meters;
```

### Search bus stops by description
```sql
SELECT * FROM onlah.bus_stops
WHERE LOWER(description) LIKE LOWER('%stadium%')
OR LOWER(road_name) LIKE LOWER('%sengkang%')
ORDER BY description;
```

---

## Bus Services & Routes

### Get all services with route coverage
```sql
SELECT * FROM onlah.v_bus_service_routes
ORDER BY service_no;
```

### Get services at a specific stop
```sql
SELECT * FROM onlah.get_services_for_stop('83139')
ORDER BY service_no;
```

### Get all stops served by a service (all directions)
```sql
SELECT DISTINCT
    r.service_no,
    s.bus_stop_code,
    s.road_name,
    s.description,
    s.latitude,
    s.longitude
FROM onlah.bus_routes r
JOIN onlah.bus_stops s ON r.bus_stop_code = s.bus_stop_code
WHERE r.service_no = '15'
ORDER BY r.direction, r.stop_sequence;
```

### Get route for a specific service and direction
```sql
SELECT
    r.service_no,
    r.direction,
    r.stop_sequence,
    r.bus_stop_code,
    s.description,
    s.latitude,
    s.longitude,
    r.distance
FROM onlah.bus_routes r
JOIN onlah.bus_stops s ON r.bus_stop_code = s.bus_stop_code
WHERE r.service_no = '15' AND r.direction = 1
ORDER BY r.stop_sequence;
```

### Get operating hours for a service
```sql
SELECT
    service_no,
    direction,
    wd_first_bus,
    wd_last_bus,
    sat_first_bus,
    sat_last_bus,
    sun_first_bus,
    sun_last_bus
FROM onlah.bus_routes
WHERE service_no = '15'
GROUP BY service_no, direction, wd_first_bus, wd_last_bus,
         sat_first_bus, sat_last_bus, sun_first_bus, sun_last_bus
ORDER BY direction;
```

### Get service metadata (express, night service, etc.)
```sql
SELECT
    service_no,
    operator,
    service_type,
    is_express,
    is_night,
    is_free_tier
FROM onlah.bus_services
WHERE service_no = '15';
```

### Check if a service is operating now (weekday 8 AM example)
```sql
SELECT
    r.service_no,
    r.direction,
    CASE
        WHEN '08:00' BETWEEN r.wd_first_bus AND r.wd_last_bus THEN 'Operating'
        ELSE 'Not Operating'
    END as status
FROM onlah.bus_routes r
WHERE r.service_no = '15'
GROUP BY r.service_no, r.direction, r.wd_first_bus, r.wd_last_bus
ORDER BY r.direction;
```

### Get all express services
```sql
SELECT
    service_no,
    operator,
    COUNT(DISTINCT direction) as num_directions
FROM onlah.bus_services
WHERE is_express = TRUE
GROUP BY service_no, operator
ORDER BY service_no;
```

### Get all night services
```sql
SELECT
    service_no,
    operator,
    COUNT(DISTINCT direction) as num_directions
FROM onlah.bus_services
WHERE is_night = TRUE
GROUP BY service_no, operator
ORDER BY service_no;
```

---

## Train Lines & Stations

### Get all train lines
```sql
SELECT * FROM onlah.train_lines
ORDER BY line_code;
```

### Get stations on a specific line
```sql
SELECT
    l.line_code,
    l.line_name,
    s.station_code,
    s.station_name,
    ls.station_sequence
FROM onlah.v_train_line_stations_detail ls
JOIN onlah.train_lines l ON ls.line_id = l.line_id
JOIN onlah.train_stations s ON ls.station_id = s.station_id
WHERE l.line_code = 'NS'
ORDER BY ls.station_sequence;
```

### Get all stations near a location
```sql
SELECT
    station_code,
    station_name,
    latitude,
    longitude,
    ROUND(earth_distance(
        ll_to_earth(1.39293, 103.8609),
        ll_to_earth(latitude, longitude)
    ))::INT as distance_meters
FROM onlah.train_stations
WHERE earth_distance(
    ll_to_earth(1.39293, 103.8609),
    ll_to_earth(latitude, longitude)
) <= 2000
ORDER BY distance_meters;
```

### Get lines serving a specific station
```sql
SELECT DISTINCT
    l.line_code,
    l.line_name,
    l.color
FROM onlah.train_lines l
JOIN onlah.train_line_stations ls ON l.line_id = ls.line_id
JOIN onlah.train_stations s ON ls.station_id = s.station_id
WHERE s.station_code = 'NK11'
ORDER BY l.line_code;
```

---

## Data Synchronization

### Check sync status for all data sources
```sql
SELECT
    data_source,
    last_sync_at,
    last_sync_status,
    records_synced,
    error_message
FROM onlah.sync_metadata
ORDER BY data_source;
```

### Check if bus stops data is fresh (< 7 days old)
```sql
SELECT
    data_source,
    last_sync_at,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_sync_at)) / 86400 as days_since_sync,
    CASE
        WHEN CURRENT_TIMESTAMP - last_sync_at < INTERVAL '7 days' THEN 'Fresh'
        ELSE 'Stale'
    END as freshness
FROM onlah.sync_metadata
WHERE data_source = 'bus_stops';
```

### Check for failed syncs
```sql
SELECT
    data_source,
    last_sync_at,
    error_message
FROM onlah.sync_metadata
WHERE last_sync_status = 'failed'
ORDER BY last_sync_at DESC;
```

### Update sync status (example: successful bus stops sync)
```sql
SELECT onlah.update_sync_metadata(
    'bus_stops',
    'success',
    5090,  -- records synced
    NULL   -- no error
);
```

### Update sync status (example: failed sync with error)
```sql
SELECT onlah.update_sync_metadata(
    'bus_routes',
    'failed',
    0,
    'Connection timeout to LTA API'
);
```

---

## Analytics & Monitoring

### Count services by operator
```sql
SELECT
    operator,
    COUNT(*) as service_count,
    SUM(CASE WHEN is_express THEN 1 ELSE 0 END) as express_services,
    SUM(CASE WHEN is_night THEN 1 ELSE 0 END) as night_services
FROM onlah.bus_services
GROUP BY operator
ORDER BY service_count DESC;
```

### Find stops with most services
```sql
SELECT
    s.bus_stop_code,
    s.description,
    COUNT(DISTINCT r.service_no) as num_services
FROM onlah.bus_stops s
LEFT JOIN onlah.bus_routes r ON s.bus_stop_code = r.bus_stop_code
GROUP BY s.bus_stop_code, s.description
HAVING COUNT(DISTINCT r.service_no) > 0
ORDER BY num_services DESC
LIMIT 20;
```

### Find stops with least services (potentially underserved)
```sql
SELECT
    s.bus_stop_code,
    s.description,
    COUNT(DISTINCT r.service_no) as num_services
FROM onlah.bus_stops s
LEFT JOIN onlah.bus_routes r ON s.bus_stop_code = r.bus_stop_code
GROUP BY s.bus_stop_code, s.description
ORDER BY num_services ASC
LIMIT 20;
```

### Coverage by operator
```sql
SELECT
    r.operator,
    COUNT(DISTINCT r.service_no) as service_count,
    COUNT(DISTINCT r.bus_stop_code) as stop_count,
    COUNT(DISTINCT r.direction) as route_directions
FROM onlah.bus_routes r
GROUP BY r.operator
ORDER BY service_count DESC;
```

### Geographic distribution of stops
```sql
SELECT
    ROUND(latitude::numeric, 1) as lat_bucket,
    ROUND(longitude::numeric, 1) as lon_bucket,
    COUNT(*) as stop_count
FROM onlah.bus_stops
GROUP BY lat_bucket, lon_bucket
ORDER BY stop_count DESC;
```

---

## Debugging & Maintenance

### Check database size
```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'onlah'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check index usage
```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'onlah'
ORDER BY idx_scan DESC;
```

### Find unused indexes
```sql
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_stat_user_indexes
WHERE schemaname = 'onlah'
AND idx_scan = 0
ORDER BY indexname;
```

### Check for NULL latitude/longitude values
```sql
SELECT COUNT(*) as null_coords
FROM onlah.bus_stops
WHERE latitude IS NULL OR longitude IS NULL;
```

### Verify referential integrity (orphaned routes)
```sql
SELECT
    r.route_id,
    r.bus_route_code,
    r.service_no,
    r.bus_stop_code
FROM onlah.bus_routes r
LEFT JOIN onlah.bus_stops s ON r.bus_stop_code = s.bus_stop_code
WHERE s.bus_stop_code IS NULL;
```

### Check for duplicate bus codes
```sql
SELECT
    bus_stop_code,
    COUNT(*) as duplicate_count
FROM onlah.bus_stops
GROUP BY bus_stop_code
HAVING COUNT(*) > 1;
```

---

## Performance Optimization

### Analyze tables (updates statistics for query planner)
```sql
ANALYZE onlah.bus_stops;
ANALYZE onlah.bus_routes;
ANALYZE onlah.bus_services;
ANALYZE onlah.train_lines;
ANALYZE onlah.train_stations;
```

### Reindex all indexes on OnLah schema
```sql
REINDEX SCHEMA onlah;
```

### Vacuum database (reclaims space)
```sql
VACUUM FULL ANALYZE onlah.bus_stops;
VACUUM FULL ANALYZE onlah.bus_routes;
```

---

## Common Use Cases in API Endpoints

### Get arrivals screen data for a stop
```sql
-- Get stop info + services operating at this stop
WITH stop_info AS (
    SELECT * FROM onlah.bus_stops WHERE bus_stop_code = '83139'
),
services_at_stop AS (
    SELECT * FROM onlah.get_services_for_stop('83139')
)
SELECT
    s.bus_stop_code,
    s.road_name,
    s.description,
    s.latitude,
    s.longitude,
    sas.service_no,
    sas.operator,
    sas.num_directions,
    bs.is_express,
    bs.is_night
FROM stop_info s
CROSS JOIN services_at_stop sas
LEFT JOIN onlah.bus_services bs ON sas.service_no = bs.service_no
ORDER BY sas.service_no;
```

### Get nearby stops for discovery screen
```sql
SELECT * FROM onlah.find_nearby_stops(1.39293, 103.8609, 500)
LIMIT 20;
```

### Get route details for a service
```sql
SELECT
    r.stop_sequence,
    r.bus_stop_code,
    s.description,
    s.latitude,
    s.longitude,
    r.distance
FROM onlah.bus_routes r
JOIN onlah.bus_stops s ON r.bus_stop_code = s.bus_stop_code
WHERE r.service_no = '15' AND r.direction = 1
ORDER BY r.stop_sequence;
```

### Check operating hours for a service now
```sql
-- For the current day/time, check if service is operating
SELECT
    service_no,
    CASE
        WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN 'Sunday'
        WHEN EXTRACT(DOW FROM CURRENT_DATE) = 6 THEN 'Saturday'
        ELSE 'Weekday'
    END as day_type,
    CASE
        WHEN EXTRACT(DOW FROM CURRENT_DATE) IN (0, 6) THEN
            CASE
                WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0
                    THEN CURRENT_TIME BETWEEN sun_first_bus::TIME AND sun_last_bus::TIME
                ELSE CURRENT_TIME BETWEEN sat_first_bus::TIME AND sat_last_bus::TIME
            END
        ELSE
            CURRENT_TIME BETWEEN wd_first_bus::TIME AND wd_last_bus::TIME
    END as is_operating
FROM onlah.bus_routes
WHERE service_no = '15'
GROUP BY service_no, wd_first_bus, wd_last_bus, sat_first_bus, sat_last_bus,
         sun_first_bus, sun_last_bus
LIMIT 1;
```

---

## Notes

- All queries use the `onlah` schema. If you're not in the onlah database, prefix with `onlah.`
- Geographic queries use `earth_distance` (requires earthdistance extension)
- Distances are returned in meters by the `find_nearby_stops()` function
- Time comparisons use 24-hour format (HH:MM)
- Timestamps are in UTC+8 timezone

For more information, see the [Database README](./README.md).
