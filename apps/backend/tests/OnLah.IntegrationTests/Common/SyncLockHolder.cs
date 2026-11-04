using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using OnLah.Infrastructure.Persistence;

namespace OnLah.IntegrationTests.Common;

internal sealed class SyncLockHolder : IAsyncDisposable
{
    private readonly IServiceScope _scope;
    private readonly IDbContextTransaction _transaction;

    private SyncLockHolder(IServiceScope scope, IDbContextTransaction transaction)
    {
        _scope = scope;
        _transaction = transaction;
    }

    public static async Task<SyncLockHolder> HoldAsync(ApiFactory factory, long lockKey)
    {
        var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<OnLahDbContext>();
        var transaction = await db.Database.BeginTransactionAsync();
        await db.Database.ExecuteSqlAsync($"SELECT pg_advisory_xact_lock({lockKey})");
        return new SyncLockHolder(scope, transaction);
    }

    public async ValueTask DisposeAsync()
    {
        await _transaction.DisposeAsync();
        _scope.Dispose();
    }
}
