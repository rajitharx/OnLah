namespace OnLah.Application.TrainAlerts;

public sealed record TrainAlertsResult(
    TrainServiceStatus Status,
    IReadOnlyList<TrainAlertDetail> Alerts
);

public sealed record TrainAlertDetail(
    string Line,
    string Direction,
    IReadOnlyList<string> Stations,
    string Message,
    DateTimeOffset CreatedAt
);

public enum TrainServiceStatus { Normal, Disrupted }
