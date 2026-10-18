namespace OnLah.Domain.BusNetwork;

public interface IBusNetworkRepository
{
    Task<IReadOnlyList<BusService>> GetServicesAsync(string serviceNo, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BusRoute>> GetRoutesAsync(string serviceNo, CancellationToken cancellationToken = default);
    Task ReplaceAllAsync(IEnumerable<BusService> services, IEnumerable<BusRoute> routes, CancellationToken cancellationToken = default);
}
