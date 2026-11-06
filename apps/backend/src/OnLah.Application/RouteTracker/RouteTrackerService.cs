using OnLah.Application.BusArrivals;
using OnLah.Application.Common.Interfaces;
using OnLah.Domain.BusNetwork;
using OnLah.Domain.BusStops;
using OnLah.Domain.Common;

namespace OnLah.Application.RouteTracker;

/// <summary>Builds the route tracker for one bus service at one stop. Live arrivals are never cached.</summary>
public sealed class RouteTrackerService(
    IBusNetworkRepository network,
    IBusStopRepository stops,
    ILtaLiveArrivalClient lta,
    IClock clock,
    StopsAwayCalculator calculator)
{
    public async Task<Result<RouteTrackerDto>> GetAsync(
        string busStopCode,
        string serviceNo,
        int? direction,
        string? destinationCode = null,
        CancellationToken cancellationToken = default)
    {
        var route = await LoadRouteAsync(serviceNo, cancellationToken);
        if (route.IsEmpty)
            return DomainError.NotFound("BusService");

        var onRoute = route.Resolve(busStopCode, direction, destinationCode: null, visitNumber: null);
        if (onRoute.IsFailure)
            return onRoute.Error;

        var arrivals = await lta.GetLiveArrivalsAsync(busStopCode, cancellationToken);
        if (arrivals.IsFailure)
            return arrivals.Error;

        var buses = BusesOf(arrivals.Value!, serviceNo, destinationCode);
        var visit = buses.Count > 0 ? buses[0].VisitNumber : null;
        var resolved = route.Resolve(busStopCode, direction, destinationCode ?? DestinationOf(buses), visit).Value!;

        return await BuildAsync(resolved, buses, cancellationToken);
    }

    // LTA lists a service once per direction at a stop, so the same number can appear twice.
    // With a destination, only the buses heading there count. Without one, the first entry is used.
    private static IReadOnlyList<LiveBus> BusesOf(IEnumerable<LiveServiceArrival> arrivals, string serviceNo, string? destinationCode)
    {
        var entries = arrivals.Where(a => string.Equals(a.ServiceNo, serviceNo, StringComparison.OrdinalIgnoreCase)).ToList();
        return destinationCode is null
            ? entries.FirstOrDefault()?.Buses ?? []
            : entries.SelectMany(a => a.Buses).Where(b => b.DestinationCode == destinationCode).ToList();
    }

    // LTA publishes some service numbers in lowercase ("10e") and most in uppercase, so try the number as given first.
    private async Task<ServiceRoute> LoadRouteAsync(string serviceNo, CancellationToken cancellationToken)
    {
        var route = ServiceRoute.From(await network.GetRoutesAsync(serviceNo, cancellationToken));
        var uppercase = serviceNo.ToUpperInvariant();
        if (!route.IsEmpty || uppercase == serviceNo)
            return route;

        return ServiceRoute.From(await network.GetRoutesAsync(uppercase, cancellationToken));
    }

    private async Task<RouteTrackerDto> BuildAsync(
        ResolvedDirection resolved,
        IReadOnlyList<LiveBus> buses,
        CancellationToken cancellationToken)
    {
        var stopList = await LoadStopsAsync(resolved.Stops, cancellationToken);
        var userSequence = stopList[resolved.UserIndex].Sequence;
        var now = clock.UtcNow;

        return new RouteTrackerDto(
            resolved.Stops[0].ServiceNo,
            resolved.Direction,
            StatusOf(buses, resolved.Stops[resolved.UserIndex], now),
            now,
            ToDto(stopList[^1]),
            resolved.UserIndex,
            stopList.Select(ToDto).ToList(),
            buses.Select(b => ToTrackedBus(b, stopList, userSequence, now)).ToList());
    }

    private async Task<List<RouteStop>> LoadStopsAsync(IReadOnlyList<BusRoute> rows, CancellationToken cancellationToken)
    {
        var found = await stops.GetByCodesAsync(rows.Select(r => r.BusStopCode).Distinct().ToList(), cancellationToken);
        var byCode = found.ToDictionary(s => s.BusStopCode);

        return rows.Select(r => byCode.TryGetValue(r.BusStopCode, out var stop) ? ToRouteStop(r, stop) : ToRouteStop(r)).ToList();
    }

    private static RouteStop ToRouteStop(BusRoute row, BusStop stop) =>
        new(row.StopSequence, row.BusStopCode, stop.Description, stop.RoadName, row.Distance, new GeoPoint(stop.Latitude, stop.Longitude));

    // A stop missing from the BusStops table is still listed, by its code, so the rail has no gap.
    private static RouteStop ToRouteStop(BusRoute row) =>
        new(row.StopSequence, row.BusStopCode, row.BusStopCode, string.Empty, row.Distance, null);

    private static string? DestinationOf(IReadOnlyList<LiveBus> buses) =>
        buses.Select(b => b.DestinationCode).FirstOrDefault(code => code is not null);

    private static TrackerStatus StatusOf(IReadOnlyList<LiveBus> buses, BusRoute userRow, DateTimeOffset now)
    {
        if (buses.Count > 0)
            return buses.Any(b => b.IsMonitored) ? TrackerStatus.Live : TrackerStatus.Scheduled;

        return ServiceHours.From(userRow).IsInOperation(now) == false ? TrackerStatus.NotInOperation : TrackerStatus.NoEstimate;
    }

    private TrackedBusDto ToTrackedBus(LiveBus bus, IReadOnlyList<RouteStop> stopList, int userSequence, DateTimeOffset now)
    {
        var minutes = Math.Max(0, (int)Math.Floor((bus.EstimatedArrival - now).TotalMinutes));
        var position = calculator.Calculate(stopList, userSequence, bus.Location);

        return new TrackedBusDto(
            bus.EstimatedArrival,
            minutes,
            minutes == 0 ? "Arr" : $"{minutes} min",
            LoadCode(bus.Load),
            bus.IsWheelchairAccessible ? "WAB" : null,
            TypeCode(bus.Type),
            bus.IsMonitored,
            position.StopsAway,
            position.NearestStopCode);
    }

    private static TrackerStopDto ToDto(RouteStop stop) =>
        new(stop.Sequence, stop.Code, stop.Description, stop.RoadName, stop.DistanceKm);

    private static string LoadCode(CrowdLevel load) => load switch
    {
        CrowdLevel.StandingAvailable => "SDA",
        CrowdLevel.LimitedStanding => "LSD",
        _ => "SEA",
    };

    private static string TypeCode(BusType type) => type switch
    {
        BusType.DoubleDeck => "DD",
        BusType.Bendy => "BD",
        _ => "SD",
    };
}
