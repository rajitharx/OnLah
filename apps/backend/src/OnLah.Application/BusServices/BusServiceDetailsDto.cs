namespace OnLah.Application.BusServices;

// Everything the popup needs for one bus service. Frequency is as LTA publishes it (minutes ranges).
// LTA publishes no weekend frequency, so the response has none.
public sealed record BusServiceDetailsDto(
    string ServiceNo,
    IReadOnlyList<string> Operators,
    IReadOnlyList<BusServiceDirectionDto> Directions);

public sealed record BusServiceDirectionDto(
    int Direction,
    string Category,
    bool IsLoop,
    string? LoopDescription,
    StopReferenceDto? Origin,
    StopReferenceDto? Destination,
    int StopCount,
    FrequencyDto Frequency,
    OperatingHoursDto Hours);

public sealed record FrequencyDto(string? AmPeak, string? AmOffPeak, string? PmPeak, string? PmOffPeak);

public sealed record OperatingHoursDto(HoursRangeDto? Weekday, HoursRangeDto? Saturday, HoursRangeDto? Sunday);

public sealed record HoursRangeDto(string First, string Last);

public sealed record StopReferenceDto(string BusStopCode, string Description, string RoadName);
