using OnLah.Domain.BusNetwork;
using OnLah.Domain.Common;

namespace OnLah.Application.RouteTracker;

public sealed record ResolvedDirection(int Direction, IReadOnlyList<BusRoute> Stops, int UserIndex);

/// <summary>All stops of one bus service, grouped by direction. It decides which direction the user's stop is on.</summary>
public sealed class ServiceRoute
{
    private readonly SortedDictionary<int, List<BusRoute>> _directions;

    private ServiceRoute(SortedDictionary<int, List<BusRoute>> directions) => _directions = directions;

    public static ServiceRoute From(IEnumerable<BusRoute> rows)
    {
        var directions = new SortedDictionary<int, List<BusRoute>>();
        foreach (var group in rows.GroupBy(r => r.Direction))
            directions[group.Key] = group.OrderBy(r => r.StopSequence).ToList();
        return new ServiceRoute(directions);
    }

    public bool IsEmpty => _directions.Count == 0;

    // A stop on both directions is told apart by the bus's destination. Without one, the first direction is a guess.
    // A loop can pass the same stop twice, and LTA's visit number says which pass this bus is making.
    public Result<ResolvedDirection> Resolve(string stopCode, int? requestedDirection, string? destinationCode, int? visitNumber)
    {
        var serving = _directions
            .Where(d => requestedDirection is null || d.Key == requestedDirection)
            .Where(d => d.Value.Any(r => r.BusStopCode == stopCode))
            .ToList();

        if (serving.Count == 0)
            return DomainError.NotFound("BusStop");

        var chosen = serving.Count > 1 && PickByDestination(serving, destinationCode) is { } match ? match : serving[0];
        return new ResolvedDirection(chosen.Key, chosen.Value, UserIndex(chosen.Value, stopCode, visitNumber));
    }

    private static KeyValuePair<int, List<BusRoute>>? PickByDestination(
        List<KeyValuePair<int, List<BusRoute>>> serving,
        string? destinationCode)
    {
        if (destinationCode is null)
            return null;

        foreach (var direction in serving)
            if (direction.Value[^1].BusStopCode == destinationCode)
                return direction;

        return null;
    }

    private static int UserIndex(List<BusRoute> stops, string stopCode, int? visitNumber)
    {
        var visits = Enumerable.Range(0, stops.Count).Where(i => stops[i].BusStopCode == stopCode).ToList();
        return visits[Math.Clamp((visitNumber ?? 1) - 1, 0, visits.Count - 1)];
    }
}
