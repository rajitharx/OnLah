namespace OnLah.Domain.BusStops;

public interface IBusStopRepository
{
    Task<IReadOnlyList<BusStop>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BusStop>> SearchAsync(StopSearchQuery query, int maxResults, CancellationToken cancellationToken = default);
    Task ReplaceAllAsync(IEnumerable<BusStop> stops, CancellationToken cancellationToken = default);
    Task<int> CountAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BusStop>> GetByCodesAsync(IEnumerable<string> busStopCodes, CancellationToken cancellationToken = default);
}
