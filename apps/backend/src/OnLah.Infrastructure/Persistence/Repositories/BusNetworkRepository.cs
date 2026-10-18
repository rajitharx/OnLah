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

    public async Task ReplaceAllAsync(IEnumerable<BusService> services, IEnumerable<BusRoute> routes, CancellationToken cancellationToken = default)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        await _context.BusRoutes.ExecuteDeleteAsync(cancellationToken);
        await _context.BusServices.ExecuteDeleteAsync(cancellationToken);
        await _context.BusServices.AddRangeAsync(services, cancellationToken);
        await _context.BusRoutes.AddRangeAsync(routes, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }
}
