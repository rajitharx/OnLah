using Microsoft.Extensions.Logging;
using OnLah.Application.Common;
using OnLah.Application.Common.Interfaces;
using OnLah.Domain.BusStops;
using OnLah.Domain.Common;

namespace OnLah.Application.BusStops;

public sealed partial class BusStopSyncService
{
    private const string Resource = "BusStopSync";

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

    public async Task<Result<int>> SyncAsync(CancellationToken cancellationToken = default)
    {
        LogSyncStarted();
        var stops = await _ltaClient.GetAllStopsAsync(cancellationToken)
            .Select(item => BusStop.Create(item.BusStopCode, item.RoadName, item.Description, item.Latitude, item.Longitude))
            .ToListAsync(cancellationToken);

        var size = new ReplacementSize(stops.Count, await _repository.CountAsync(cancellationToken));
        if (!size.IsPlausible)
        {
            LogImplausibleReply(size.Fetched, size.Stored);
            return DomainError.Unavailable(Resource);
        }

        if (!await _repository.ReplaceAllAsync(stops, cancellationToken))
            return DomainError.Conflict(Resource, "A bus stop sync is already running.");

        LogSyncComplete(stops.Count);
        return stops.Count;
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Bus stop sync started")]
    private partial void LogSyncStarted();

    [LoggerMessage(Level = LogLevel.Warning, Message = "Bus stop sync refused: LTA sent {Fetched} stops against {Stored} stored")]
    private partial void LogImplausibleReply(int fetched, int stored);

    [LoggerMessage(Level = LogLevel.Information, Message = "Bus stop sync complete — {Count} stops loaded")]
    private partial void LogSyncComplete(int count);
}
