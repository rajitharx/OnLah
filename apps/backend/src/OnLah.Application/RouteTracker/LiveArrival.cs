using OnLah.Application.BusArrivals;
using OnLah.Domain.Common;

namespace OnLah.Application.RouteTracker;

// A bus as LTA reports it right now. Location is set only for a monitored bus with a usable GPS fix.
public sealed record LiveBus(
    DateTimeOffset EstimatedArrival,
    bool IsMonitored,
    GeoPoint? Location,
    string? DestinationCode,
    int? VisitNumber,
    CrowdLevel Load,
    bool IsWheelchairAccessible,
    BusType Type);

public sealed record LiveServiceArrival(string ServiceNo, IReadOnlyList<LiveBus> Buses);
