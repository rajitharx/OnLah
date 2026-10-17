-- OnLah PostgreSQL Extensions
-- Required extensions for geographic data and performance

-- earthdistance: Provides earth_distance and ll_to_earth functions
-- Used for calculating geographic distances between coordinates
-- Required for nearby bus stop discovery (within ~500m radius)
CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;

-- cube: Required dependency for earthdistance
-- Provides multi-dimensional data type and geometric functions
CREATE EXTENSION IF NOT EXISTS cube CASCADE;

-- Verify extensions are loaded
SELECT
    extname,
    extversion
FROM pg_extension
WHERE extname IN ('earthdistance', 'cube')
ORDER BY extname;
