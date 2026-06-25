using System.Text.Json.Serialization;

namespace OnLah.Infrastructure.Lta;

internal sealed record LtaBusArrivalResponse(
    [property: JsonPropertyName("BusStopCode")] string BusStopCode,
    [property: JsonPropertyName("Services")] IReadOnlyList<LtaService> Services
);

internal sealed record LtaService(
    [property: JsonPropertyName("ServiceNo")] string ServiceNo,
    [property: JsonPropertyName("Operator")] string Operator,
    [property: JsonPropertyName("NextBus")] LtaArrivalTiming NextBus,
    [property: JsonPropertyName("NextBus2")] LtaArrivalTiming NextBus2,
    [property: JsonPropertyName("NextBus3")] LtaArrivalTiming NextBus3
);

internal sealed record LtaArrivalTiming(
    [property: JsonPropertyName("EstimatedArrival")] string EstimatedArrival,
    [property: JsonPropertyName("Monitored")] int Monitored,
    [property: JsonPropertyName("Load")] string Load,
    [property: JsonPropertyName("Feature")] string Feature,
    [property: JsonPropertyName("Type")] string Type
);
