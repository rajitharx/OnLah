using OnLah.Domain.BusStops;
using OnLah.Domain.Common;

namespace OnLah.Application.BusStops;

public sealed class GetNearbyStopsService
{
    private readonly IBusStopRepository _repository;

    public GetNearbyStopsService(IBusStopRepository repository) =>
        _repository = repository;

    public async Task<Result<IReadOnlyList<BusStopDto>>> GetNearbyAsync(
        double latitude,
        double longitude,
        double radiusMeters,
        CancellationToken cancellationToken = default)
    {
        var all = await _repository.GetAllAsync(cancellationToken);

        var nearby = all
            .Select(s => (Stop: s, Distance: Haversine(latitude, longitude, s.Latitude, s.Longitude)))
            .Where(x => x.Distance <= radiusMeters)
            .OrderBy(x => x.Distance)
            .Select(x => new BusStopDto(
                x.Stop.BusStopCode,
                x.Stop.RoadName,
                x.Stop.Description,
                x.Stop.Latitude,
                x.Stop.Longitude,
                Math.Round(x.Distance, 1)))
            .ToList();

        return nearby;
    }

    internal static double Haversine(double lat1, double lon1, double lat2, double lon2)
    {
        const double EarthRadiusMetres = 6_371_000;
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2))
              * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return EarthRadiusMetres * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;
}
