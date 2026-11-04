namespace OnLah.Infrastructure.Lta;

public sealed class LtaOptions
{
    public const string SectionName = "Lta";

    public required string AccountKey { get; init; }
    public required string BaseUrl { get; init; }
    public int TimeoutSeconds { get; init; } = 10;
    public int ArrivalCacheSeconds { get; init; } = 15;
    public int TrainAlertCacheSeconds { get; init; } = 30;
}
