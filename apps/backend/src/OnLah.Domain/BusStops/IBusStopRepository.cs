namespace OnLah.Domain.BusStops;

public interface IBusStopRepository
{
    Task<IReadOnlyList<BusStop>> GetAllAsync(CancellationToken cancellationToken = default);
    Task ReplaceAllAsync(IEnumerable<BusStop> stops, CancellationToken cancellationToken = default);
    Task<int> CountAsync(CancellationToken cancellationToken = default);
}
