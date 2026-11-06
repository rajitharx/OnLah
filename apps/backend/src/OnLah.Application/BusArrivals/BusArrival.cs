namespace OnLah.Application.BusArrivals;

public sealed record BusArrival(
    string ServiceNo,
    string Operator,
    ArrivalTiming? NextBus,
    ArrivalTiming? NextBus2,
    ArrivalTiming? NextBus3
)
{
    // Where the service starts and ends, one entry per direction that calls at the stop.
    public IReadOnlyList<ArrivalRoute> Routes { get; init; } = [];
}

// DestinationCode is the last stop of the direction and matches ArrivalTiming.DestinationCode of the buses running it.
public sealed record ArrivalRoute(string Origin, string Destination, string DestinationCode);

public sealed record ArrivalTiming(
    DateTimeOffset EstimatedArrival,
    CrowdLevel Load,
    bool IsWheelchairAccessible,
    BusType Type,
    bool IsMonitored,
    bool IsLastBus,
    string? DestinationCode = null
);

public enum CrowdLevel { SeatsAvailable, StandingAvailable, LimitedStanding }

public enum BusType { SingleDeck, DoubleDeck, Bendy }
