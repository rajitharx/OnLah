using OnLah.Domain.BusStops;
using OnLah.Domain.Common;

namespace OnLah.Application.BusStops;

public sealed class SearchBusStopsService
{
    private const int MaxResults = 20;
    private readonly IBusStopRepository _repository;

    public SearchBusStopsService(IBusStopRepository repository) =>
        _repository = repository;

    public async Task<Result<IReadOnlyList<BusStopDto>>> SearchAsync(
        string query,
        CancellationToken cancellationToken = default)
    {
        var stops = await _repository.SearchAsync(query, MaxResults, cancellationToken);

        var results = stops
            .Select(s => new BusStopDto(s.BusStopCode, s.RoadName, s.Description, s.Latitude, s.Longitude, 0))
            .ToList();

        return results;
    }
}
