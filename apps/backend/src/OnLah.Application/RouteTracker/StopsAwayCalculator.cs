using OnLah.Domain.Common;

namespace OnLah.Application.RouteTracker;

public sealed record StopsAwayResult(int? StopsAway, string? NearestStopCode)
{
    public static readonly StopsAwayResult Unknown = new(null, null);
}

/// <summary>
/// LTA does not say which stop a bus is at, so this derives it from the bus's GPS position.
/// It snaps the bus to the nearest stop at or before the user's stop. A far or ambiguous fix gives no answer.
/// </summary>
public sealed class StopsAwayCalculator(double maxSnapMeters = 400, double tieToleranceMeters = 15)
{
    private const int MaxTiedSequenceSpread = 2;

    public StopsAwayResult Calculate(IReadOnlyList<RouteStop> stops, int userSequence, GeoPoint? bus)
    {
        if (bus is null)
            return StopsAwayResult.Unknown;

        var candidates = MeasureCandidates(stops, userSequence, bus.Value);
        if (candidates.Count == 0)
            return StopsAwayResult.Unknown;

        var nearest = candidates.Min(c => c.Meters);
        if (nearest > maxSnapMeters)
            return StopsAwayResult.Unknown;

        return Snap(candidates.Where(c => c.Meters <= nearest + tieToleranceMeters).ToList(), userSequence);
    }

    private static List<Candidate> MeasureCandidates(IReadOnlyList<RouteStop> stops, int userSequence, GeoPoint bus) =>
        stops
            .Where(s => s.Sequence <= userSequence && s.Location is not null)
            .Select(s => new Candidate(s, bus.DistanceMetersTo(s.Location!.Value)))
            .ToList();

    // Equally near stops are usually neighbours, so take the one closer to the user to avoid overstating the count.
    // Tied stops far apart in sequence are a loop revisiting one place, and the bus could be on either pass.
    private static StopsAwayResult Snap(List<Candidate> tied, int userSequence)
    {
        var spread = tied.Max(c => c.Stop.Sequence) - tied.Min(c => c.Stop.Sequence);
        if (spread > MaxTiedSequenceSpread)
            return StopsAwayResult.Unknown;

        var snapped = tied.MaxBy(c => c.Stop.Sequence)!.Stop;
        return new StopsAwayResult(userSequence - snapped.Sequence, snapped.Code);
    }

    private sealed record Candidate(RouteStop Stop, double Meters);
}
