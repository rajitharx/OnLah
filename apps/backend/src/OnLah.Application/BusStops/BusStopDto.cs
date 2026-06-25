namespace OnLah.Application.BusStops;

public sealed record BusStopDto(
    string BusStopCode,
    string RoadName,
    string Description,
    double Latitude,
    double Longitude,
    double DistanceMeters
);
