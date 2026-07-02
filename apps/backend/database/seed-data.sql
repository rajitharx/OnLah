-- OnLah Seed Data
-- Sample data for development and testing
-- This file demonstrates the data structure for manual testing or local development

-- WARNING: This file is FOR REFERENCE only.
-- Do NOT use in production. Production data comes from LTA API sync jobs.

SET search_path TO onlah, public;

-- ============================================================================
-- SAMPLE BUS STOPS (Sengkang area)
-- ============================================================================

INSERT INTO bus_stops (bus_stop_code, road_name, description, latitude, longitude) VALUES
('83139', 'Sengkang Road', 'Sengkang Stadium', 1.39293, 103.8609),
('83109', 'Sengkang Road', 'Compassvale Rd', 1.38985, 103.86541),
('83189', 'Sengkang Road', 'Fernvale Road', 1.3863, 103.88297),
('83119', 'Sengkang Road', 'Cove Way', 1.40185, 103.88012),
('83149', 'Sengkang Road', 'Airport Road', 1.39578, 103.85267),
('83159', 'Sengkang Road', 'Buangkok Lane', 1.3948, 103.87123),
('83169', 'Sengkang Road', 'Belum Lane', 1.39685, 103.88901)
ON CONFLICT (bus_stop_code) DO NOTHING;

-- ============================================================================
-- SAMPLE BUS SERVICES
-- ============================================================================

INSERT INTO bus_services (service_no, operator, service_type, is_express, is_night, is_free_tier) VALUES
('15', 'GAS', 'PT', FALSE, FALSE, FALSE),
('15A', 'GAS', 'PT', TRUE, FALSE, FALSE),
('15e', 'GAS', 'PT', FALSE, FALSE, FALSE),
('175', 'SMRT', 'PT', FALSE, FALSE, FALSE),
('175e', 'SMRT', 'PT', FALSE, FALSE, FALSE),
('180', 'SBST', 'PT', FALSE, FALSE, FALSE),
('800', 'SMRT', 'PT', TRUE, FALSE, FALSE),
('N14', 'SBS', 'PT', FALSE, TRUE, FALSE)
ON CONFLICT (service_no) DO NOTHING;

-- ============================================================================
-- SAMPLE BUS ROUTES (Service 15 as example)
-- ============================================================================

INSERT INTO bus_routes (
    bus_route_code, service_no, operator, direction, stop_sequence,
    bus_stop_code, distance,
    wd_first_bus, wd_last_bus, sat_first_bus, sat_last_bus, sun_first_bus, sun_last_bus
) VALUES
-- Service 15, Direction 1 (Outbound)
('15-1-1', '15', 'GAS', 1, 1, '83139', 0.00, '05:30', '23:00', '05:30', '23:00', '05:45', '23:00'),
('15-1-2', '15', 'GAS', 1, 2, '83109', 0.65, '05:30', '23:00', '05:30', '23:00', '05:45', '23:00'),
('15-1-3', '15', 'GAS', 1, 3, '83159', 1.20, '05:30', '23:00', '05:30', '23:00', '05:45', '23:00'),
('15-1-4', '15', 'GAS', 1, 4, '83189', 2.10, '05:30', '23:00', '05:30', '23:00', '05:45', '23:00'),

-- Service 15, Direction 2 (Inbound)
('15-2-1', '15', 'GAS', 2, 1, '83189', 0.00, '05:45', '23:15', '05:45', '23:15', '06:00', '23:15'),
('15-2-2', '15', 'GAS', 2, 2, '83159', 0.95, '05:45', '23:15', '05:45', '23:15', '06:00', '23:15'),
('15-2-3', '15', 'GAS', 2, 3, '83109', 1.80, '05:45', '23:15', '05:45', '23:15', '06:00', '23:15'),
('15-2-4', '15', 'GAS', 2, 4, '83139', 2.55, '05:45', '23:15', '05:45', '23:15', '06:00', '23:15'),

-- Service 175, Direction 1
('175-1-1', '175', 'SMRT', 1, 1, '83119', 0.00, '06:00', '00:00', '06:00', '00:00', '06:30', '23:30'),
('175-1-2', '175', 'SMRT', 1, 2, '83139', 0.80, '06:00', '00:00', '06:00', '00:00', '06:30', '23:30'),
('175-1-3', '175', 'SMRT', 1, 3, '83149', 1.45, '06:00', '00:00', '06:00', '00:00', '06:30', '23:30'),

-- Service 175, Direction 2
('175-2-1', '175', 'SMRT', 2, 1, '83149', 0.00, '06:15', '00:15', '06:15', '00:15', '06:45', '23:45'),
('175-2-2', '175', 'SMRT', 2, 2, '83139', 0.70, '06:15', '00:15', '06:15', '00:15', '06:45', '23:45'),
('175-2-3', '175', 'SMRT', 2, 3, '83119', 1.50, '06:15', '00:15', '06:15', '00:15', '06:45', '23:45')
ON CONFLICT (bus_route_code) DO NOTHING;

-- ============================================================================
-- SAMPLE TRAIN LINES
-- ============================================================================

INSERT INTO train_lines (line_code, line_name, line_abbreviation, color) VALUES
('NS', 'North-South Line', 'NS', 'FF0000'),      -- Red
('EW', 'East-West Line', 'EW', '00AF00'),        -- Green
('NE', 'North-East Line', 'NE', '9F2F9F'),       -- Purple
('CC', 'Circle Line', 'CC', 'FF9900'),           -- Orange
('TE', 'Thomson-East Coast Line', 'TE', 'AA0033'), -- Maroon
('JE', 'Jurong East Line', 'JE', '009999'),      -- Teal
('STC', 'Sengkang–Punggol LRT', 'STC', 'AA9933') -- Brown
ON CONFLICT (line_code) DO NOTHING;

-- ============================================================================
-- SAMPLE TRAIN STATIONS (Sengkang area)
-- ============================================================================

INSERT INTO train_stations (station_code, station_name, latitude, longitude) VALUES
('NK11', 'Sengkang', 1.39278, 103.89452),
('NE12', 'Sengkang', 1.39278, 103.89452),  -- Interchange
('STC1', 'Sengkang', 1.39278, 103.89452),  -- Interchange
('NK10', 'Punggol', 1.40458, 103.90584),
('NE11', 'Buangkok', 1.40765, 103.88976),
('STC2', 'Punggol Coast', 1.40522, 103.91524),
('NE13', 'Serangoon', 1.37175, 103.86989)
ON CONFLICT (station_code) DO NOTHING;

-- ============================================================================
-- TRAIN LINE-STATION MAPPINGS
-- ============================================================================

INSERT INTO train_line_stations (line_id, station_id, station_sequence)
SELECT
    (SELECT line_id FROM train_lines WHERE line_code = 'NK'),
    (SELECT station_id FROM train_stations WHERE station_code = 'NK11'),
    2
WHERE EXISTS (SELECT 1 FROM train_lines WHERE line_code = 'NK')
AND EXISTS (SELECT 1 FROM train_stations WHERE station_code = 'NK11')
ON CONFLICT (line_id, station_id) DO NOTHING;

-- Add more mappings for other lines...
-- (In production, this is generated from LTA API data with complete station sequences)

-- ============================================================================
-- INITIALIZE SYNC METADATA
-- ============================================================================

-- The sync_metadata table is pre-populated in schema.sql
-- Verify it's set up correctly:
SELECT * FROM sync_metadata;

-- ============================================================================
-- VERIFY DATA INSERTION
-- ============================================================================

-- Count records by table
SELECT
    'bus_stops' as table_name,
    COUNT(*) as record_count
FROM bus_stops
UNION ALL
SELECT
    'bus_services' as table_name,
    COUNT(*) as record_count
FROM bus_services
UNION ALL
SELECT
    'bus_routes' as table_name,
    COUNT(*) as record_count
FROM bus_routes
UNION ALL
SELECT
    'train_lines' as table_name,
    COUNT(*) as record_count
FROM train_lines
UNION ALL
SELECT
    'train_stations' as table_name,
    COUNT(*) as record_count
FROM train_stations
ORDER BY table_name;

-- ============================================================================
-- EXAMPLE QUERIES (FOR TESTING)
-- ============================================================================

-- Find nearby bus stops (1 km radius from Sengkang Stadium)
-- SELECT * FROM find_nearby_stops(1.39293, 103.8609, 1000);

-- Get all services at Sengkang Stadium
-- SELECT * FROM get_services_for_stop('83139');

-- Find all stops served by Service 15
-- SELECT DISTINCT s.bus_stop_code, s.road_name, s.description
-- FROM bus_routes r
-- JOIN bus_stops s ON r.bus_stop_code = s.bus_stop_code
-- WHERE r.service_no = '15'
-- ORDER BY r.stop_sequence;

-- Get service operating hours for a specific direction
-- SELECT
--     service_no,
--     direction,
--     CONCAT(wd_first_bus, ' - ', wd_last_bus) as weekday_hours,
--     CONCAT(sat_first_bus, ' - ', sat_last_bus) as saturday_hours,
--     CONCAT(sun_first_bus, ' - ', sun_last_bus) as sunday_hours
-- FROM bus_routes
-- WHERE service_no = '15'
-- GROUP BY service_no, direction, wd_first_bus, wd_last_bus,
--          sat_first_bus, sat_last_bus, sun_first_bus, sun_last_bus
-- ORDER BY direction;

-- ============================================================================
-- NOTES
-- ============================================================================

/*
This seed data file is for DEVELOPMENT ONLY and demonstrates:

1. Expected data structure for bus stops (code, location, metadata)
2. Service information structure (operator, type flags)
3. Route sequencing with operating hours
4. Train line and station information
5. Relationships between entities

Production data comes from automated LTA API sync jobs that:
- Run weekly for static data (stops, routes, services)
- Use pagination to retrieve all ~5,000 stops
- Replace entire tables in transactions for consistency
- Log sync status and timestamps to sync_metadata

To load this seed data for testing:
  psql -d onlah -f seed-data.sql

To clear and reload:
  psql -d onlah << EOF
  TRUNCATE TABLE train_line_stations CASCADE;
  TRUNCATE TABLE train_lines CASCADE;
  TRUNCATE TABLE train_stations CASCADE;
  TRUNCATE TABLE bus_routes CASCADE;
  TRUNCATE TABLE bus_services CASCADE;
  TRUNCATE TABLE bus_stops CASCADE;
  EOF
  psql -d onlah -f seed-data.sql
*/
