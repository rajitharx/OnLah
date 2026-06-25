# Backend Commands

All commands run from `apps/backend/` unless noted.

## Run the API

```bash
./run.sh
```

Requires `ASPNETCORE_ENVIRONMENT=Development` (set automatically by the script) and the secrets below.

## Secrets (one-time setup)

```bash
cd src/OnLah.Api
dotnet user-secrets set "Lta__AccountKey" "your-lta-key"
```

The PostgreSQL connection string lives in `src/OnLah.Api/appsettings.Development.json`.

## Build

```bash
dotnet build
```

## Tests

```bash
# All tests
dotnet test

# Unit tests only
dotnet test tests/OnLah.UnitTests

# With output
dotnet test --logger "console;verbosity=detailed"
```

## Database

```bash
# First-time setup: EnsureCreated runs automatically on startup.
# When ready to switch to migrations:
dotnet ef migrations add InitialCreate \
  --project src/OnLah.Infrastructure \
  --startup-project src/OnLah.Api

# Apply migrations (replace EnsureCreatedAsync with MigrateAsync in Program.cs first)
dotnet ef database update \
  --project src/OnLah.Infrastructure \
  --startup-project src/OnLah.Api
```

## Bus Stop Sync

After first deploy, seed the bus stops table:

```bash
curl -X POST http://localhost:5050/api/v1/admin/bus-stops/sync
```

This fetches all ~5,000 Singapore bus stops from LTA (paginated) and replaces the local cache.

## Useful Endpoints (local)

```bash
# Bus arrivals
curl "http://localhost:5050/api/v1/bus-arrivals?stopCode=03519"

# Nearby stops
curl "http://localhost:5050/api/v1/bus-stops/nearby?lat=1.3048&lng=103.8318&radiusMeters=500"

# Train alerts
curl "http://localhost:5050/api/v1/train-alerts"

# OpenAPI docs
open http://localhost:5050/openapi/v1.json
```
