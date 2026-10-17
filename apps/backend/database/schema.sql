-- OnLah PostgreSQL Database Schema
-- Version: 1.0.0
-- Purpose: LTA data caching and transit information storage for OnLah v1

-- ============================================================================
-- SCHEMA SETUP
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS onlah;
SET search_path TO onlah, public;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Bus Stops Table
-- Caches LTA BusStops API data; refreshed weekly
CREATE TABLE bus_stops (
    bus_stop_code VARCHAR(5) PRIMARY KEY,
    road_name VARCHAR(100) NOT NULL,
    description VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bus Routes Table
-- Caches LTA BusRoutes API data; provides route sequencing and operating hours
CREATE TABLE bus_routes (
    route_id SERIAL PRIMARY KEY,
    bus_route_code VARCHAR(10) NOT NULL UNIQUE,
    service_no VARCHAR(10) NOT NULL,
    operator VARCHAR(10) NOT NULL, -- SBST, SMRT, TTS, GAS
    direction INT NOT NULL, -- 1 or 2
    stop_sequence INT NOT NULL,
    bus_stop_code VARCHAR(5) NOT NULL REFERENCES bus_stops(bus_stop_code) ON DELETE CASCADE,
    distance DECIMAL(8, 2), -- Distance in km from start of route
    wd_first_bus VARCHAR(5), -- Weekday first bus HH:MM
    wd_last_bus VARCHAR(5), -- Weekday last bus HH:MM
    sat_first_bus VARCHAR(5), -- Saturday first bus HH:MM
    sat_last_bus VARCHAR(5), -- Saturday last bus HH:MM
    sun_first_bus VARCHAR(5), -- Sunday first bus HH:MM
    sun_last_bus VARCHAR(5), -- Sunday last bus HH:MM
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bus Services Table
-- Caches LTA BusServices API data; provides service-level metadata
CREATE TABLE bus_services (
    bus_service_id SERIAL PRIMARY KEY,
    service_no VARCHAR(10) NOT NULL UNIQUE,
    operator VARCHAR(10) NOT NULL, -- SBST, SMRT, TTS, GAS
    service_type VARCHAR(5), -- PT (public transport), OP (operator specific), etc.
    is_express BOOLEAN DEFAULT FALSE,
    is_night BOOLEAN DEFAULT FALSE,
    is_free_tier BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Train Lines Table
-- Caches train line information for disruption alerts
CREATE TABLE train_lines (
    line_id SERIAL PRIMARY KEY,
    line_code VARCHAR(10) NOT NULL UNIQUE,
    line_name VARCHAR(100) NOT NULL,
    line_abbreviation VARCHAR(5) NOT NULL,
    color VARCHAR(7), -- Hex color for UI display
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Train Stations Table
-- Caches train station information for alert mapping
CREATE TABLE train_stations (
    station_id SERIAL PRIMARY KEY,
    station_code VARCHAR(10) NOT NULL UNIQUE,
    station_name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Train Line-Station Junction Table
-- Maps which stations are on which lines (many-to-many)
CREATE TABLE train_line_stations (
    line_station_id SERIAL PRIMARY KEY,
    line_id INT NOT NULL REFERENCES train_lines(line_id) ON DELETE CASCADE,
    station_id INT NOT NULL REFERENCES train_stations(station_id) ON DELETE CASCADE,
    station_sequence INT NOT NULL, -- Order of station on the line
    UNIQUE(line_id, station_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- BusStops indexes
CREATE INDEX idx_bus_stops_location ON bus_stops USING GIST (
    ll_to_earth(latitude, longitude)
);
CREATE INDEX idx_bus_stops_description ON bus_stops(description);

-- BusRoutes indexes
CREATE INDEX idx_bus_routes_service_no ON bus_routes(service_no);
CREATE INDEX idx_bus_routes_bus_stop_code ON bus_routes(bus_stop_code);
CREATE INDEX idx_bus_routes_operator ON bus_routes(operator);
CREATE INDEX idx_bus_routes_service_stop ON bus_routes(service_no, bus_stop_code);

-- BusServices indexes
CREATE INDEX idx_bus_services_operator ON bus_services(operator);
CREATE INDEX idx_bus_services_service_type ON bus_services(service_type);

-- TrainLines indexes
CREATE INDEX idx_train_lines_code ON train_lines(line_code);

-- TrainStations indexes
CREATE INDEX idx_train_stations_code ON train_stations(station_code);
CREATE INDEX idx_train_stations_location ON train_stations USING GIST (
    ll_to_earth(latitude, longitude)
);

-- TrainLineStations indexes
CREATE INDEX idx_train_line_stations_line_id ON train_line_stations(line_id);
CREATE INDEX idx_train_line_stations_station_id ON train_line_stations(station_id);

-- ============================================================================
-- DATA SYNCHRONIZATION METADATA TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_metadata (
    sync_id SERIAL PRIMARY KEY,
    data_source VARCHAR(50) NOT NULL UNIQUE, -- 'bus_stops', 'bus_routes', 'bus_services', 'train_lines', 'train_stations'
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'success', 'failed'
    error_message TEXT,
    records_synced INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Initialize sync metadata for all data sources
INSERT INTO sync_metadata (data_source, last_sync_status)
VALUES
    ('bus_stops', 'pending'),
    ('bus_routes', 'pending'),
    ('bus_services', 'pending'),
    ('train_lines', 'pending'),
    ('train_stations', 'pending')
ON CONFLICT (data_source) DO NOTHING;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for bus service information with route details
CREATE OR REPLACE VIEW v_bus_service_routes AS
SELECT
    s.service_no,
    s.operator,
    s.service_type,
    s.is_express,
    s.is_night,
    COUNT(DISTINCT r.direction) as num_directions,
    COUNT(DISTINCT r.bus_stop_code) as num_stops,
    MIN(r.created_at) as first_route_added,
    MAX(r.updated_at) as last_route_updated
FROM bus_services s
LEFT JOIN bus_routes r ON s.service_no = r.service_no
GROUP BY s.service_no, s.operator, s.service_type, s.is_express, s.is_night;

-- View for nearby bus stops (helper for geographic queries)
CREATE OR REPLACE VIEW v_bus_stops_geographic AS
SELECT
    bus_stop_code,
    road_name,
    description,
    latitude,
    longitude,
    ll_to_earth(latitude, longitude)::earth as location
FROM bus_stops;

-- View for train line service status
CREATE OR REPLACE VIEW v_train_line_stations_detail AS
SELECT
    l.line_id,
    l.line_code,
    l.line_name,
    l.line_abbreviation,
    l.color,
    s.station_id,
    s.station_code,
    s.station_name,
    s.latitude,
    s.longitude,
    ls.station_sequence
FROM train_lines l
JOIN train_line_stations ls ON l.line_id = ls.line_id
JOIN train_stations s ON ls.station_id = s.station_id
ORDER BY l.line_id, ls.station_sequence;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Procedure to find nearby bus stops within a radius
CREATE OR REPLACE FUNCTION find_nearby_stops(
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_radius_meters INT DEFAULT 500
)
RETURNS TABLE (
    bus_stop_code VARCHAR(5),
    road_name VARCHAR(100),
    description VARCHAR(200),
    latitude DECIMAL,
    longitude DECIMAL,
    distance_meters INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.bus_stop_code,
        b.road_name,
        b.description,
        b.latitude,
        b.longitude,
        ROUND(earth_distance(
            ll_to_earth(p_latitude, p_longitude),
            ll_to_earth(b.latitude, b.longitude)
        ))::INT as distance_meters
    FROM bus_stops b
    WHERE earth_distance(
        ll_to_earth(p_latitude, p_longitude),
        ll_to_earth(b.latitude, b.longitude)
    ) <= p_radius_meters
    ORDER BY earth_distance(
        ll_to_earth(p_latitude, p_longitude),
        ll_to_earth(b.latitude, b.longitude)
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Procedure to get all services for a specific stop
CREATE OR REPLACE FUNCTION get_services_for_stop(p_bus_stop_code VARCHAR(5))
RETURNS TABLE (
    service_no VARCHAR(10),
    operator VARCHAR(10),
    service_type VARCHAR(5),
    is_express BOOLEAN,
    is_night BOOLEAN,
    num_directions INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        s.service_no,
        s.operator,
        s.service_type,
        s.is_express,
        s.is_night,
        COUNT(DISTINCT r.direction) as num_directions
    FROM bus_routes r
    JOIN bus_services s ON r.service_no = s.service_no
    WHERE r.bus_stop_code = p_bus_stop_code
    GROUP BY s.service_no, s.operator, s.service_type, s.is_express, s.is_night
    ORDER BY s.service_no;
END;
$$ LANGUAGE plpgsql STABLE;

-- Procedure to update sync metadata
CREATE OR REPLACE FUNCTION update_sync_metadata(
    p_data_source VARCHAR(50),
    p_status VARCHAR(20),
    p_records_synced INT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    UPDATE sync_metadata
    SET
        last_sync_at = CURRENT_TIMESTAMP,
        last_sync_status = p_status,
        records_synced = COALESCE(p_records_synced, records_synced),
        error_message = p_error_message,
        updated_at = CURRENT_TIMESTAMP
    WHERE data_source = p_data_source;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamp for bus_stops
CREATE OR REPLACE FUNCTION update_bus_stops_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bus_stops_updated_at
BEFORE UPDATE ON bus_stops
FOR EACH ROW
EXECUTE FUNCTION update_bus_stops_timestamp();

-- Auto-update timestamp for bus_routes
CREATE OR REPLACE FUNCTION update_bus_routes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bus_routes_updated_at
BEFORE UPDATE ON bus_routes
FOR EACH ROW
EXECUTE FUNCTION update_bus_routes_timestamp();

-- Auto-update timestamp for bus_services
CREATE OR REPLACE FUNCTION update_bus_services_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bus_services_updated_at
BEFORE UPDATE ON bus_services
FOR EACH ROW
EXECUTE FUNCTION update_bus_services_timestamp();

-- Auto-update timestamp for train_lines
CREATE OR REPLACE FUNCTION update_train_lines_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_train_lines_updated_at
BEFORE UPDATE ON train_lines
FOR EACH ROW
EXECUTE FUNCTION update_train_lines_timestamp();

-- Auto-update timestamp for train_stations
CREATE OR REPLACE FUNCTION update_train_stations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_train_stations_updated_at
BEFORE UPDATE ON train_stations
FOR EACH ROW
EXECUTE FUNCTION update_train_stations_timestamp();

-- Auto-update timestamp for sync_metadata
CREATE OR REPLACE FUNCTION update_sync_metadata_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_metadata_updated_at
BEFORE UPDATE ON sync_metadata
FOR EACH ROW
EXECUTE FUNCTION update_sync_metadata_timestamp();

-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON SCHEMA onlah IS 'OnLah public transit application schema';

COMMENT ON TABLE bus_stops IS 'Caches LTA BusStops API data; refreshed weekly. Used for nearby stop discovery and stop metadata.';
COMMENT ON COLUMN bus_stops.bus_stop_code IS 'Unique 5-digit bus stop code from LTA (e.g., "83139"); primary key';
COMMENT ON COLUMN bus_stops.latitude IS 'Geographic latitude in WGS84 format (high precision)';
COMMENT ON COLUMN bus_stops.longitude IS 'Geographic longitude in WGS84 format (high precision)';

COMMENT ON TABLE bus_routes IS 'Caches LTA BusRoutes API data; provides route sequencing, operating hours, and distance information.';
COMMENT ON COLUMN bus_routes.service_no IS 'Bus service number (e.g., "15", "165X")';
COMMENT ON COLUMN bus_routes.operator IS 'Bus operator code: SBST, SMRT, TTS, or GAS';
COMMENT ON COLUMN bus_routes.direction IS '1 for first direction, 2 for return direction';
COMMENT ON COLUMN bus_routes.stop_sequence IS 'Sequential position of this stop in the route';

COMMENT ON TABLE bus_services IS 'Caches LTA BusServices API data; stores service-level metadata for filtering and categorization.';
COMMENT ON COLUMN bus_services.service_type IS 'Service classification (e.g., PT for public transport)';
COMMENT ON COLUMN bus_services.is_express IS 'Express services skip certain stops';
COMMENT ON COLUMN bus_services.is_night IS 'Night services operate during midnight hours';

COMMENT ON TABLE train_lines IS 'Singapore MRT/LRT line definitions for disruption alert mapping.';
COMMENT ON COLUMN train_lines.color IS 'Hex color for UI line identification (e.g., "FF0000" for red)';

COMMENT ON TABLE train_stations IS 'Singapore MRT/LRT station definitions with geographic coordinates.';

COMMENT ON FUNCTION find_nearby_stops(DECIMAL, DECIMAL, INT) IS
'Finds bus stops within specified radius using geographic distance calculation. Uses earth_distance for accuracy.';

COMMENT ON FUNCTION get_services_for_stop(VARCHAR) IS
'Returns all bus services operating at a specific bus stop, grouped by direction count.';

-- ============================================================================
-- GRANTS (Optional: Configure for your database users)
-- ============================================================================

-- Example grants for application user (adjust role name as needed):
-- CREATE ROLE onlah_app WITH LOGIN PASSWORD 'secure_password';
-- GRANT CONNECT ON DATABASE onlah TO onlah_app;
-- GRANT USAGE ON SCHEMA onlah TO onlah_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA onlah TO onlah_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA onlah TO onlah_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA onlah TO onlah_app;

-- ============================================================================
-- NOTES
-- ============================================================================

/*
REFRESH STRATEGY:

1. BUS_STOPS: Weekly (Sunday 2 AM UTC+8)
   - Fetch all stops from LTA BusStops API with pagination
   - Replace entire table in transaction
   - Update sync_metadata with timestamp and record count

2. BUS_ROUTES: Weekly (Sunday 2:15 AM UTC+8)
   - Fetch all routes from LTA BusRoutes API with pagination
   - Update operating hours per direction
   - Update sync_metadata

3. BUS_SERVICES: Weekly (Sunday 2:30 AM UTC+8)
   - Fetch all services from LTA BusServices API
   - Update service metadata (type, express, night flags)
   - Update sync_metadata

4. TRAIN_LINES & TRAIN_STATIONS: Monthly (First Sunday of month, 2:45 AM UTC+8)
   - Fetch from LTA if available, or maintain manually
   - Update geographic coordinates
   - Update sync_metadata

5. TRANSIT ALERTS (Real-time, not persisted):
   - Fetch from LTA TrainServiceAlerts API every 2 minutes
   - Display current status without persistence in v1
   - Can add persistence table in v2 for analytics

GEOGRAPHIC QUERIES:

The schema uses PostgreSQL's earth_distance extension (contrib) for geographic
distance calculations. Ensures accurate nearby-stop discovery within ~500m radius.

Enable with:
  CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;

PERFORMANCE NOTES:

- bus_stops has a GIST index on geographic coordinates for fast spatial queries
- bus_routes indexed on (service_no, bus_stop_code) for rapid service lookup
- All tables have created_at and updated_at for audit trails
- sync_metadata tracks data freshness and sync errors
- Views provide convenient queries without exposing raw schema to API layer

*/
