#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# LTA AccountKey is required — set via env var or dotnet user-secrets
: "${Lta__AccountKey:?Set Lta__AccountKey to your LTA DataMall account key}"

export ASPNETCORE_ENVIRONMENT="${ASPNETCORE_ENVIRONMENT:-Development}"

echo "Starting OnLah API (env: $ASPNETCORE_ENVIRONMENT)..."

dotnet run \
  --project "$SCRIPT_DIR/src/OnLah.Api/OnLah.Api.csproj" \
  --launch-profile http
