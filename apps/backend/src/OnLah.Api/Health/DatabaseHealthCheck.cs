using Microsoft.Extensions.Diagnostics.HealthChecks;
using OnLah.Infrastructure.Persistence;

namespace OnLah.Api.Health;

internal sealed class DatabaseHealthCheck(OnLahDbContext db) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default) =>
        await db.Database.CanConnectAsync(cancellationToken)
            ? HealthCheckResult.Healthy()
            : HealthCheckResult.Unhealthy("Database is unreachable.");
}
