using System.Globalization;
using OnLah.Application.RouteTracker;
using OnLah.Domain.Common;

namespace OnLah.Infrastructure.Lta;

internal sealed partial class LtaBusClient
{
    public async Task<Result<IReadOnlyList<LiveServiceArrival>>> GetLiveArrivalsAsync(
        string stopCode,
        CancellationToken cancellationToken = default)
    {
        var fetched = await FetchServicesAsync(stopCode, cancellationToken);
        if (fetched.IsFailure)
            return fetched.Error;

        return fetched.Value!.Select(MapLive).ToList();
    }

    private static LiveServiceArrival MapLive(LtaService service) => new(
        service.ServiceNo,
        new[] { service.NextBus, service.NextBus2, service.NextBus3 }
            .Select(MapLiveBus)
            .OfType<LiveBus>()
            .ToList());

    private static LiveBus? MapLiveBus(LtaArrivalTiming? timing)
    {
        if (timing is null || string.IsNullOrEmpty(timing.EstimatedArrival))
            return null;

        var monitored = timing.Monitored == 1;
        return new LiveBus(
            DateTimeOffset.Parse(timing.EstimatedArrival, CultureInfo.InvariantCulture),
            monitored,
            monitored ? ParseLocation(timing.Latitude, timing.Longitude) : null,
            string.IsNullOrEmpty(timing.DestinationCode) ? null : timing.DestinationCode,
            int.TryParse(timing.VisitNumber, CultureInfo.InvariantCulture, out var visit) ? visit : null,
            MapLoad(timing.Load),
            timing.Feature == "WAB",
            MapType(timing.Type));
    }

    // LTA sends "0.0" for a bus it cannot place, so a fix outside Singapore is treated as no fix.
    private static GeoPoint? ParseLocation(string? latitude, string? longitude)
    {
        if (!double.TryParse(latitude, CultureInfo.InvariantCulture, out var lat)
            || !double.TryParse(longitude, CultureInfo.InvariantCulture, out var lng))
            return null;

        var point = new GeoPoint(lat, lng);
        return point.IsWithinSingapore ? point : null;
    }
}
