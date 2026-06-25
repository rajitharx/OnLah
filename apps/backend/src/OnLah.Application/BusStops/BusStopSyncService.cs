using Microsoft.Extensions.Logging;
using OnLah.Application.Common.Interfaces;
using OnLah.Domain.BusStops;

namespace OnLah.Application.BusStops;

public sealed partial class BusStopSyncService
{
    private readonly ILtaBusStopClient _ltaClient;
    private readonly IBusStopRepository _repository;
    private readonly ILogger<BusStopSyncService> _logger;

    public BusStopSyncService(
        ILtaBusStopClient ltaClient,
        IBusStopRepository repository,
        ILogger<BusStopSyncService> logger)
    {
        _ltaClient = ltaClient;
        _repository = repository;
        _logger = logger;
    }

    public async Task<int> SyncAsync(CancellationToken cancellationToken = default)
    {
        LogSyncStarted();
        var stops = new List<BusStop>();

        await foreach (var item in _ltaClient.GetAllStopsAsync(cancellationToken))
        {
            stops.Add(BusStop.Create(
                item.BusStopCode,
                item.RoadName,
                item.Description,
                item.Latitude,
                item.Longitude));
        }

        await _repository.ReplaceAllAsync(stops, cancellationToken);
        LogSyncComplete(stops.Count);
        return stops.Count;
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Bus stop sync started")]
    private partial void LogSyncStarted();

    [LoggerMessage(Level = LogLevel.Information, Message = "Bus stop sync complete — {Count} stops loaded")]
    private partial void LogSyncComplete(int count);
}
