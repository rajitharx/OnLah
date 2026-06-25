using System.Text.Json.Serialization;

namespace OnLah.Infrastructure.Lta;

internal sealed record LtaBusStopPageResponse(
    [property: JsonPropertyName("value")] IReadOnlyList<LtaBusStopItem> Value
);

internal sealed record LtaBusStopItem(
    [property: JsonPropertyName("BusStopCode")] string BusStopCode,
    [property: JsonPropertyName("RoadName")] string RoadName,
    [property: JsonPropertyName("Description")] string Description,
    [property: JsonPropertyName("Latitude")] double Latitude,
    [property: JsonPropertyName("Longitude")] double Longitude
);
