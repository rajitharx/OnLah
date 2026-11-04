namespace OnLah.Domain.BusNetwork;

public interface IBusNetworkRepository
{
    Task<IReadOnlyList<BusService>> GetServicesAsync(string serviceNo, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BusRoute>> GetRoutesAsync(string serviceNo, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BusRoute>> GetRoutesForStopAsync(string stopCode, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BusService>> GetServicesForStopAsync(string stopCode, CancellationToken cancellationToken = default);
    Task<(int Services, int Routes)> CountAsync(CancellationToken cancellationToken = default);

    /// <summary>Swaps the stored network for the given rows. Returns false, changing nothing, while another sync is writing.</summary>
    Task<bool> ReplaceAllAsync(IEnumerable<BusService> services, IEnumerable<BusRoute> routes, CancellationToken cancellationToken = default);
}
