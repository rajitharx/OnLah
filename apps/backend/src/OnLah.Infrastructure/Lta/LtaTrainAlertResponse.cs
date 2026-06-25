using System.Text.Json.Serialization;

namespace OnLah.Infrastructure.Lta;

internal sealed record LtaTrainAlertResponse(
    [property: JsonPropertyName("value")] IReadOnlyList<LtaTrainAlertCluster> Value
);

internal sealed record LtaTrainAlertCluster(
    [property: JsonPropertyName("Status")] int Status,
    [property: JsonPropertyName("Line")] string Line,
    [property: JsonPropertyName("Direction")] string Direction,
    [property: JsonPropertyName("Stations")] string Stations,
    [property: JsonPropertyName("Message")] IReadOnlyList<LtaTrainMessage> Message
);

internal sealed record LtaTrainMessage(
    [property: JsonPropertyName("Content")] string Content,
    [property: JsonPropertyName("CreatedDate")] string CreatedDate
);
