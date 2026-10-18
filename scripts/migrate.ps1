param(
    [string]$Connection = $env:ConnectionStrings__DefaultConnection
)

$ErrorActionPreference = 'Stop'

if (-not $Connection) {
    throw 'Pass the connection string as -Connection or set ConnectionStrings__DefaultConnection.'
}

$backend = Join-Path (Split-Path -Parent $PSScriptRoot) 'apps/backend'
Push-Location $backend
try {
    dotnet ef database update `
        --project src/OnLah.Infrastructure `
        --startup-project src/OnLah.Api `
        --connection $Connection
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    Pop-Location
}
