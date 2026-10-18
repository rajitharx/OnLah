#!/usr/bin/env bash
# Applies EF Core migrations to a database.
#   scripts/migrate.sh "<connection string>"
#   ConnectionStrings__DefaultConnection="<connection string>" scripts/migrate.sh
set -euo pipefail

CONNECTION="${1:-${ConnectionStrings__DefaultConnection:-}}"
if [ -z "$CONNECTION" ]; then
  echo "Pass the connection string as an argument or set ConnectionStrings__DefaultConnection." >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT/apps/backend"

dotnet ef database update \
  --project src/OnLah.Infrastructure \
  --startup-project src/OnLah.Api \
  --connection "$CONNECTION"
