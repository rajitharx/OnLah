using Microsoft.Extensions.Logging;
using OnLah.Application.Common.Interfaces;
using OnLah.Application.RouteTracker;
using OnLah.Domain.BusNetwork;
using OnLah.Domain.Common;

namespace OnLah.Application.BusArrivals;

public sealed partial class GetBusArrivalsService(
    ILtaBusClient ltaBusClient,
    IBusNetworkRepository network,
    ILogger<GetBusArrivalsService> logger)
{
    public async Task<Result<IReadOnlyList<BusArrival>>> GetAsync(
        string stopCode,
        CancellationToken cancellationToken = default)
    {
        var arrivals = await ltaBusClient.GetArrivalsAsync(stopCode, cancellationToken);
        if (arrivals.IsFailure)
            return arrivals;

        var hoursByService = await LoadServiceHoursAsync(stopCode, cancellationToken);
        return Result.Success<IReadOnlyList<BusArrival>>(
            arrivals.Value!.Select(a => MarkLastBus(a, hoursByService[a.ServiceNo])).ToList());
    }

    // LTA publishes some service numbers in lowercase ("10e"), and arrivals and routes need not agree on case.
    private async Task<ILookup<string, ServiceHours>> LoadServiceHoursAsync(string stopCode, CancellationToken cancellationToken)
    {
        IReadOnlyList<BusRoute> routes;
        try
        {
            routes = await network.GetRoutesForStopAsync(stopCode, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            LogServiceHoursUnavailable(ex, stopCode);
            routes = [];
        }

        return routes.ToLookup(r => r.ServiceNo, ServiceHours.From, StringComparer.OrdinalIgnoreCase);
    }

    // A timing with a later bus of the same service behind it cannot be the last bus, so only the latest match is flagged.
    private static BusArrival MarkLastBus(BusArrival arrival, IEnumerable<ServiceHours> hours)
    {
        ArrivalTiming?[] timings = [arrival.NextBus, arrival.NextBus2, arrival.NextBus3];
        var last = Array.FindLastIndex(timings, t => t is not null && hours.Any(h => h.IsLastBus(t.EstimatedArrival)));

        return arrival with
        {
            NextBus = WithLastBus(arrival.NextBus, last == 0),
            NextBus2 = WithLastBus(arrival.NextBus2, last == 1),
            NextBus3 = WithLastBus(arrival.NextBus3, last == 2),
        };
    }

    private static ArrivalTiming? WithLastBus(ArrivalTiming? timing, bool isLastBus) =>
        timing is null ? null : timing with { IsLastBus = isLastBus };

    [LoggerMessage(Level = LogLevel.Warning, Message = "Last-bus times unavailable for stop {StopCode}")]
    private partial void LogServiceHoursUnavailable(Exception exception, string stopCode);
}
