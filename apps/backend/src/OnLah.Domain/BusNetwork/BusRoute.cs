namespace OnLah.Domain.BusNetwork;

// One stop on one direction of a bus service, as published by LTA BusRoutes.
// Times are HHMM strings as LTA sends them. Some are "-" or empty when not published.
public sealed record BusRoute
{
    public required string ServiceNo { get; init; }
    public required int Direction { get; init; }
    public required int StopSequence { get; init; }
    public required string BusStopCode { get; init; }
    public required string Operator { get; init; }
    public required double Distance { get; init; }
    public required string WdFirst { get; init; }
    public required string WdLast { get; init; }
    public required string SatFirst { get; init; }
    public required string SatLast { get; init; }
    public required string SunFirst { get; init; }
    public required string SunLast { get; init; }

    public static BusRoute Create(
        string serviceNo,
        int direction,
        int stopSequence,
        string busStopCode,
        string operatorCode,
        double distance,
        string wdFirst,
        string wdLast,
        string satFirst,
        string satLast,
        string sunFirst,
        string sunLast) =>
        new()
        {
            ServiceNo = serviceNo,
            Direction = direction,
            StopSequence = stopSequence,
            BusStopCode = busStopCode,
            Operator = operatorCode,
            Distance = distance,
            WdFirst = wdFirst,
            WdLast = wdLast,
            SatFirst = satFirst,
            SatLast = satLast,
            SunFirst = sunFirst,
            SunLast = sunLast,
        };
}
