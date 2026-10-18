using System.Text.Json.Serialization;

namespace OnLah.Infrastructure.Lta;

internal sealed record LtaPage<T>([property: JsonPropertyName("value")] IReadOnlyList<T> Value);

internal sealed record LtaBusServiceItem(
    [property: JsonPropertyName("ServiceNo")] string ServiceNo,
    [property: JsonPropertyName("Operator")] string Operator,
    [property: JsonPropertyName("Direction")] int Direction,
    [property: JsonPropertyName("Category")] string Category,
    [property: JsonPropertyName("OriginCode")] string OriginCode,
    [property: JsonPropertyName("DestinationCode")] string DestinationCode,
    [property: JsonPropertyName("AM_Peak_Freq")] string? AmPeakFreq,
    [property: JsonPropertyName("AM_Offpeak_Freq")] string? AmOffpeakFreq,
    [property: JsonPropertyName("PM_Peak_Freq")] string? PmPeakFreq,
    [property: JsonPropertyName("PM_Offpeak_Freq")] string? PmOffpeakFreq,
    [property: JsonPropertyName("LoopDesc")] string? LoopDesc
);

internal sealed record LtaBusRouteItem(
    [property: JsonPropertyName("ServiceNo")] string ServiceNo,
    [property: JsonPropertyName("Operator")] string Operator,
    [property: JsonPropertyName("Direction")] int Direction,
    [property: JsonPropertyName("StopSequence")] int StopSequence,
    [property: JsonPropertyName("BusStopCode")] string BusStopCode,
    [property: JsonPropertyName("Distance")] double Distance,
    [property: JsonPropertyName("WD_FirstBus")] string WdFirst,
    [property: JsonPropertyName("WD_LastBus")] string WdLast,
    [property: JsonPropertyName("SAT_FirstBus")] string SatFirst,
    [property: JsonPropertyName("SAT_LastBus")] string SatLast,
    [property: JsonPropertyName("SUN_FirstBus")] string SunFirst,
    [property: JsonPropertyName("SUN_LastBus")] string SunLast
);
