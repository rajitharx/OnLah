using OnLah.Domain.Common;

namespace OnLah.Application.RouteTracker;

// One stop on a service's route, in order. Location is null when the stop is missing from the BusStops table.
public sealed record RouteStop(
    int Sequence,
    string Code,
    string Description,
    string RoadName,
    double DistanceKm,
    GeoPoint? Location);
