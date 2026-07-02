#!/bin/bash
# OnLah PostgreSQL Database Setup Script
# This script initializes the PostgreSQL database for the OnLah application

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-onlah}"
DB_USER="${DB_USER:-postgres}"
SCHEMA_FILE="$(dirname "$0")/schema.sql"
EXTENSIONS_FILE="$(dirname "$0")/extensions.sql"

echo "=========================================="
echo "OnLah Database Setup"
echo "=========================================="
echo ""
echo "Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "Error: psql not found. Please install PostgreSQL client tools."
    exit 1
fi

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "Error: Schema file not found at $SCHEMA_FILE"
    exit 1
fi

# Prompt for password if not set
if [ -z "$PGPASSWORD" ]; then
    read -sp "Enter PostgreSQL password for $DB_USER: " PGPASSWORD
    echo ""
    export PGPASSWORD
fi

# Function to execute SQL
execute_sql() {
    local sql="$1"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "$sql"
}

# Function to execute SQL file
execute_sql_file() {
    local file="$1"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -f "$file"
}

echo "Step 1: Creating database '$DB_NAME'..."
execute_sql "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "  Database already exists or error occurred"

echo "Step 2: Enabling required extensions..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;
CREATE EXTENSION IF NOT EXISTS cube CASCADE;
EOF

echo "Step 3: Executing schema script..."
execute_sql_file "$SCHEMA_FILE"

echo "Step 4: Verifying schema creation..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
\dt onlah.*
\df onlah.*
EOF

echo ""
echo "=========================================="
echo "✓ Database setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update your appsettings.json with the database connection string:"
echo "   Server=$DB_HOST;Port=$DB_PORT;Database=$DB_NAME;User Id=$DB_USER;Password=<password>"
echo ""
echo "2. Test the connection:"
echo "   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c 'SELECT COUNT(*) FROM onlah.bus_stops;'"
echo ""
echo "3. Initialize data by running LTA API sync (see sync scripts)"
echo ""
