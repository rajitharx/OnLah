namespace OnLah.Application.Common.Interfaces;

public sealed record LtaBusStop(
    string BusStopCode,
    string RoadName,
    string Description,
    double Latitude,
    double Longitude
);

public interface ILtaBusStopClient
{
    IAsyncEnumerable<LtaBusStop> GetAllStopsAsync(CancellationToken cancellationToken = default);
}
