using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL.Infrastructure;

namespace OnLah.Infrastructure.Persistence;

public static class OnLahNpgsqlOptions
{
    public static void Configure(NpgsqlDbContextOptionsBuilder options) =>
        options.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorCodesToAdd: null);
}
