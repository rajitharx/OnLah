namespace OnLah.Domain.BusStops;

public sealed class BusStop
{
    private BusStop() { }

    public required string BusStopCode { get; init; }
    public required string RoadName { get; init; }
    public required string Description { get; init; }
    public required double Latitude { get; init; }
    public required double Longitude { get; init; }

    public static BusStop Create(
        string busStopCode,
        string roadName,
        string description,
        double latitude,
        double longitude) =>
        new()
        {
            BusStopCode = busStopCode,
            RoadName = roadName,
            Description = description,
            Latitude = latitude,
            Longitude = longitude
        };
}
