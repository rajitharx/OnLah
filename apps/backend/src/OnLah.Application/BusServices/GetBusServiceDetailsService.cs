using System.Text.RegularExpressions;
using OnLah.Domain.BusNetwork;
using OnLah.Domain.BusStops;
using OnLah.Domain.Common;

namespace OnLah.Application.BusServices;

public sealed partial class GetBusServiceDetailsService
{
    private readonly IBusNetworkRepository _network;
    private readonly IBusStopRepository _stops;

    public GetBusServiceDetailsService(IBusNetworkRepository network, IBusStopRepository stops)
    {
        _network = network;
        _stops = stops;
    }

    public async Task<Result<BusServiceDetailsDto>> GetAsync(string serviceNo, CancellationToken cancellationToken = default)
    {
        var services = await _network.GetServicesAsync(serviceNo, cancellationToken);
        if (services.Count == 0)
            return DomainError.NotFound("BusService");

        var routes = await _network.GetRoutesAsync(serviceNo, cancellationToken);
        var stopLookup = await LookupStopsAsync(services, routes, cancellationToken);

        var directions = services
            .OrderBy(s => s.Direction)
            .Select(s => BuildDirection(s, routes.Where(r => r.Direction == s.Direction).OrderBy(r => r.StopSequence).ToList(), stopLookup))
            .ToList();

        var operators = services.Select(s => s.Operator).Distinct().Order().ToList();
        return new BusServiceDetailsDto(serviceNo, operators, directions);
    }

    private async Task<IReadOnlyDictionary<string, BusStop>> LookupStopsAsync(
        IReadOnlyList<BusService> services,
        IReadOnlyList<BusRoute> routes,
        CancellationToken cancellationToken)
    {
        var codes = services
            .SelectMany(s => new[] { s.OriginCode, s.DestinationCode })
            .Concat(routes.Select(r => r.BusStopCode))
            .Distinct()
            .ToList();

        var found = await _stops.GetByCodesAsync(codes, cancellationToken);
        return found.ToDictionary(s => s.BusStopCode);
    }

    private static BusServiceDirectionDto BuildDirection(
        BusService service,
        List<BusRoute> stops,
        IReadOnlyDictionary<string, BusStop> lookup)
    {
        var first = stops.Count > 0 ? stops[0] : null;
        var hours = first is null
            ? new OperatingHoursDto(null, null, null)
            : new OperatingHoursDto(
                Range(first.WdFirst, first.WdLast),
                Range(first.SatFirst, first.SatLast),
                Range(first.SunFirst, first.SunLast));

        return new BusServiceDirectionDto(
            Direction: service.Direction,
            Category: service.Category,
            IsLoop: !string.IsNullOrEmpty(service.LoopDesc),
            LoopDescription: service.LoopDesc,
            Origin: ToStopReference(service.OriginCode, lookup),
            Destination: ToStopReference(service.DestinationCode, lookup),
            StopCount: stops.Count,
            Frequency: new FrequencyDto(service.AmPeakFreq, service.AmOffpeakFreq, service.PmPeakFreq, service.PmOffpeakFreq),
            Hours: hours);
    }

    private static StopReferenceDto? ToStopReference(string busStopCode, IReadOnlyDictionary<string, BusStop> lookup) =>
        lookup.TryGetValue(busStopCode, out var stop)
            ? new StopReferenceDto(stop.BusStopCode, stop.Description, stop.RoadName)
            : null;

    private static HoursRangeDto? Range(string first, string last) =>
        IsHhmm(first) && IsHhmm(last) ? new HoursRangeDto(ToClock(first), ToClock(last)) : null;

    private static bool IsHhmm(string value) => HhmmPattern().IsMatch(value);

    private static string ToClock(string hhmm) => $"{hhmm[..2]}:{hhmm[2..]}";

    [GeneratedRegex(@"^([01]\d|2[0-3])[0-5]\d$")]
    private static partial Regex HhmmPattern();
}
