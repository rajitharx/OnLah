using Microsoft.EntityFrameworkCore;
using OnLah.Domain.BusStops;

namespace OnLah.Infrastructure.Persistence.Repositories;

internal sealed class BusStopRepository : IBusStopRepository
{
    private readonly OnLahDbContext _context;

    public BusStopRepository(OnLahDbContext context) => _context = context;

    public async Task<IReadOnlyList<BusStop>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await _context.BusStops.AsNoTracking().ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<BusStop>> SearchAsync(string query, int maxResults, CancellationToken cancellationToken = default)
    {
        var trimmed = query.Trim();
        return await _context.BusStops
            .AsNoTracking()
            .Where(s => EF.Functions.ILike(s.BusStopCode, $"{trimmed}%")
                     || EF.Functions.ILike(s.Description, $"%{trimmed}%"))
            .OrderBy(s => s.BusStopCode)
            .Take(maxResults)
            .ToListAsync(cancellationToken);
    }

    public async Task ReplaceAllAsync(IEnumerable<BusStop> stops, CancellationToken cancellationToken = default)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        await _context.BusStops.ExecuteDeleteAsync(cancellationToken);
        await _context.BusStops.AddRangeAsync(stops, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

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
