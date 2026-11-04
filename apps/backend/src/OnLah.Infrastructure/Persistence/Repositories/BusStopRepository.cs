using System.Linq.Expressions;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using OnLah.Domain.BusStops;

namespace OnLah.Infrastructure.Persistence.Repositories;

internal sealed class BusStopRepository : IBusStopRepository
{
    private readonly OnLahDbContext _context;

    public BusStopRepository(OnLahDbContext context) => _context = context;

    public async Task<IReadOnlyList<BusStop>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _context.BusStops.AsNoTracking().ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<BusStop>> SearchAsync(StopSearchQuery query, int maxResults, CancellationToken cancellationToken = default)
    {
        if (query.Terms.Count == 0)
            return [];

        var stops = _context.BusStops.AsNoTracking();
        foreach (var term in query.Terms)
            stops = stops.Where(Matches(term));

        return await stops.OrderBy(s => s.BusStopCode).Take(maxResults).ToListAsync(cancellationToken);
    }

    // Postgres \m marks the start of a word and \M the end. The typed word may be half-typed, so it only has to start a word.
    // Another spelling must be the whole word, so "Street" also finds "St" but not "Stn".
    // Terms hold only letters and digits, so they go into the patterns unescaped.
    private static Expression<Func<BusStop, bool>> Matches(StopSearchTerm term)
    {
        var pattern = $@"\m(?:{string.Join('|', term.Alternates.Select(a => a + @"\M").Prepend(term.Text))})";
        var codePattern = $"%{term.Text}%";

        return term.IsDigits
            ? s => EF.Functions.ILike(s.BusStopCode, codePattern)
                || Regex.IsMatch(s.Description + " " + s.RoadName, pattern, RegexOptions.IgnoreCase)
            : s => Regex.IsMatch(s.Description + " " + s.RoadName, pattern, RegexOptions.IgnoreCase);
    }

    public Task<bool> ReplaceAllAsync(IEnumerable<BusStop> stops, CancellationToken cancellationToken = default) =>
        _context.Database.CreateExecutionStrategy().ExecuteAsync(async ct =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(ct);
            if (!await _context.Database.TryAcquireForTransactionAsync(SyncLocks.BusStops, ct))
                return false;

            await _context.BusStops.ExecuteDeleteAsync(ct);
            await _context.BusStops.AddRangeAsync(stops, ct);
            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return true;
        }, cancellationToken);

    public async Task<IReadOnlyList<BusStop>> GetByCodesAsync(IEnumerable<string> busStopCodes, CancellationToken cancellationToken = default)
    {
        var codes = busStopCodes.ToList();
        return await _context.BusStops.AsNoTracking()
            .Where(s => codes.Contains(s.BusStopCode))
            .ToListAsync(cancellationToken);
    }

    public Task<int> CountAsync(CancellationToken cancellationToken = default) =>
        _context.BusStops.CountAsync(cancellationToken);
}
