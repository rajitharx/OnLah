using System.Text.Json.Serialization;

namespace OnLah.Infrastructure.Lta;

// LTA returns one feed object, not a list. Status 2 means disrupted; AffectedSegments lists the lines.
internal sealed record LtaTrainAlertResponse(
    [property: JsonPropertyName("value")] LtaTrainAlertFeed? Value
);

internal sealed record LtaTrainAlertFeed(
    [property: JsonPropertyName("Status")] int Status,
    [property: JsonPropertyName("AffectedSegments")] IReadOnlyList<LtaAffectedSegment>? AffectedSegments,
    [property: JsonPropertyName("Message")] IReadOnlyList<LtaTrainMessage>? Message
);

internal sealed record LtaAffectedSegment(
    [property: JsonPropertyName("Line")] string Line,
    [property: JsonPropertyName("Direction")] string Direction,
    [property: JsonPropertyName("Stations")] string? Stations
);

internal sealed record LtaTrainMessage(
    [property: JsonPropertyName("Content")] string? Content,
    [property: JsonPropertyName("CreatedDate")] string? CreatedDate
);
