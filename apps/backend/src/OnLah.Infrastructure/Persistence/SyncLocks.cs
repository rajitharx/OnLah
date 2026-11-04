using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace OnLah.Infrastructure.Persistence;

// Postgres advisory lock keys, one per dataset, so a stop sync and a network sync can still run side by side.
// A transaction-scoped lock is released on commit or rollback, so a crashed sync never leaves it held.
internal static class SyncLocks
{
    internal const long BusStops = 0x4F4E4C41_00000001;
    internal const long BusNetwork = 0x4F4E4C41_00000002;

    internal static async Task<bool> TryAcquireForTransactionAsync(this DatabaseFacade database, long key, CancellationToken cancellationToken) =>
        await database.SqlQuery<bool>($"SELECT pg_try_advisory_xact_lock({key}) AS \"Value\"")
            .SingleAsync(cancellationToken);
}
