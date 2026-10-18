using Microsoft.Extensions.Diagnostics.HealthChecks;
using OnLah.Infrastructure.Persistence;

namespace OnLah.Api.Health;

internal sealed class DatabaseHealthCheck(OnLahDbContext db) : IHealthCheck
{
    // Retry-on-failure keeps retrying an unreachable database, so the probe needs its own deadline.
    private static readonly TimeSpan Deadline = TimeSpan.FromSeconds(5);

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        using var deadline = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        deadline.CancelAfter(Deadline);

        try
        {
            return await db.Database.CanConnectAsync(deadline.Token)
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Unhealthy("Database is unreachable.");
        }
        catch (Exception) when (!cancellationToken.IsCancellationRequested)
        {
            return HealthCheckResult.Unhealthy("Database is unreachable.");
        }
    }
}
