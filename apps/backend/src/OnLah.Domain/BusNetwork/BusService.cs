namespace OnLah.Domain.BusNetwork;

// One direction of a bus service, as published by LTA BusServices.
public sealed record BusService
{
    public required string ServiceNo { get; init; }
    public required int Direction { get; init; }
    public required string Operator { get; init; }
    public required string Category { get; init; }
    public required string OriginCode { get; init; }
    public required string DestinationCode { get; init; }
    public string? AmPeakFreq { get; init; }
    public string? AmOffpeakFreq { get; init; }
    public string? PmPeakFreq { get; init; }
    public string? PmOffpeakFreq { get; init; }
    public string? LoopDesc { get; init; }

    public static BusService Create(
        string serviceNo,
        int direction,
        string operatorCode,
        string category,
        string originCode,
        string destinationCode,
        string? amPeakFreq,
        string? amOffpeakFreq,
        string? pmPeakFreq,
        string? pmOffpeakFreq,
        string? loopDesc) =>
        new()
        {
            ServiceNo = serviceNo,
            Direction = direction,
            Operator = operatorCode,
            Category = category,
            OriginCode = originCode,
            DestinationCode = destinationCode,
            AmPeakFreq = amPeakFreq,
            AmOffpeakFreq = amOffpeakFreq,
            PmPeakFreq = pmPeakFreq,
            PmOffpeakFreq = pmOffpeakFreq,
            LoopDesc = loopDesc,
        };
}
