namespace OnLah.Application.BusArrivals;

public sealed record BusArrival(
    string ServiceNo,
    string Operator,
    ArrivalTiming? NextBus,
    ArrivalTiming? NextBus2,
    ArrivalTiming? NextBus3
);

public sealed record ArrivalTiming(
    DateTimeOffset EstimatedArrival,
    CrowdLevel Load,
    bool IsWheelchairAccessible,
    BusType Type
);

public enum CrowdLevel { SeatsAvailable, StandingAvailable, LimitedStanding }

public enum BusType { SingleDeck, DoubleDeck, Bendy }
