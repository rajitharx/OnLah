using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OnLah.Infrastructure.Persistence;
using OnLah.IntegrationTests.Common;
using Xunit;

namespace OnLah.IntegrationTests.Persistence;

public sealed class DatabaseMigrationTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Startup_AppliesInitialCreateMigration()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OnLahDbContext>();

        var applied = await db.Database.GetAppliedMigrationsAsync();

        Assert.Contains(applied, migration => migration.EndsWith("_InitialCreate", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Startup_LeavesNoPendingMigrations()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OnLahDbContext>();

        var pending = await db.Database.GetPendingMigrationsAsync();

        Assert.Empty(pending);
    }
}
