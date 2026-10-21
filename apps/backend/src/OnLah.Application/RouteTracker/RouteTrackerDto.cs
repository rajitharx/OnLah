using System.Text.Json.Serialization;

namespace OnLah.Application.RouteTracker;

[JsonConverter(typeof(JsonStringEnumConverter<TrackerStatus>))]
public enum TrackerStatus
{
    [JsonStringEnumMemberName("live")] Live,
    [JsonStringEnumMemberName("scheduled")] Scheduled,
    [JsonStringEnumMemberName("noEstimate")] NoEstimate,
    [JsonStringEnumMemberName("notInOperation")] NotInOperation,
}

public sealed record TrackerStopDto(int Sequence, string BusStopCode, string Description, string RoadName, double DistanceKm);

// Load, Feature and Type use LTA's own codes (SEA/SDA/LSD, WAB, SD/DD/BD), so mobile can reuse the same mapping.
public sealed record TrackedBusDto(
    DateTimeOffset EstimatedArrival,
    int EtaMinutes,
    string EtaLabel,
    string Load,
    string? Feature,
    string Type,
    bool Monitored,
    int? StopsAway,
    string? NearestStopCode);

public sealed record RouteTrackerDto(
    string ServiceNo,
    int Direction,
    TrackerStatus Status,
    DateTimeOffset FetchedAt,
    TrackerStopDto Destination,
    int UserStopIndex,
    IReadOnlyList<TrackerStopDto> Stops,
    IReadOnlyList<TrackedBusDto> Buses);
