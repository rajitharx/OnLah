using Microsoft.EntityFrameworkCore;
using OnLah.Domain.BusNetwork;

namespace OnLah.Infrastructure.Persistence.Repositories;

internal sealed class BusNetworkRepository : IBusNetworkRepository
{
    private readonly OnLahDbContext _context;

    public BusNetworkRepository(OnLahDbContext context) => _context = context;

    public async Task<IReadOnlyList<BusService>> GetServicesAsync(string serviceNo, CancellationToken cancellationToken = default) =>
        await _context.BusServices.AsNoTracking()
            .Where(s => s.ServiceNo == serviceNo)
            .OrderBy(s => s.Direction)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<BusRoute>> GetRoutesAsync(string serviceNo, CancellationToken cancellationToken = default) =>
        await _context.BusRoutes.AsNoTracking()
            .Where(r => r.ServiceNo == serviceNo)
            .OrderBy(r => r.Direction)
            .ThenBy(r => r.StopSequence)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<BusRoute>> GetRoutesForStopAsync(string stopCode, CancellationToken cancellationToken = default) =>
        await _context.BusRoutes.AsNoTracking()
            .Where(r => r.BusStopCode == stopCode)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<BusService>> GetServicesForStopAsync(string stopCode, CancellationToken cancellationToken = default) =>
        await _context.BusServices.AsNoTracking()
            .Where(s => _context.BusRoutes.Any(r =>
                r.BusStopCode == stopCode && r.ServiceNo == s.ServiceNo && r.Direction == s.Direction))
            .OrderBy(s => s.ServiceNo)
            .ThenBy(s => s.Direction)
            .ToListAsync(cancellationToken);

    public async Task ReplaceAllAsync(IEnumerable<BusService> services, IEnumerable<BusRoute> routes, CancellationToken cancellationToken = default)
    {
        await _context.Database.CreateExecutionStrategy().ExecuteAsync(async ct =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(ct);
            await _context.BusRoutes.ExecuteDeleteAsync(ct);
            await _context.BusServices.ExecuteDeleteAsync(ct);
            await _context.BusServices.AddRangeAsync(services, ct);
            await _context.BusRoutes.AddRangeAsync(routes, ct);
            await _context.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
        }, cancellationToken);
    }
}
