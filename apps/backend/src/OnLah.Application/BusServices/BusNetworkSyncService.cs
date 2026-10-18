using Microsoft.Extensions.Logging;
using OnLah.Application.Common.Interfaces;
using OnLah.Domain.BusNetwork;

namespace OnLah.Application.BusServices;

public sealed record BusNetworkSyncResult(int ServicesSynced, int RoutesSynced);

// Reads the whole bus network from LTA before writing anything. A failed read leaves the stored copy as it was.
public sealed partial class BusNetworkSyncService
{
    private readonly ILtaBusNetworkClient _lta;
    private readonly IBusNetworkRepository _repository;
    private readonly ILogger<BusNetworkSyncService> _logger;

    public BusNetworkSyncService(ILtaBusNetworkClient lta, IBusNetworkRepository repository, ILogger<BusNetworkSyncService> logger)
    {
        _lta = lta;
        _repository = repository;
        _logger = logger;
    }

    public async Task<BusNetworkSyncResult> SyncAsync(CancellationToken cancellationToken = default)
    {
        LogSyncStarted();
        var services = new List<BusService>();
        await foreach (var service in _lta.GetAllServicesAsync(cancellationToken))
            services.Add(service);

        var routes = new List<BusRoute>();
        await foreach (var route in _lta.GetAllRoutesAsync(cancellationToken))
            routes.Add(route);

        await _repository.ReplaceAllAsync(services, routes, cancellationToken);
        LogSyncComplete(services.Count, routes.Count);
        return new BusNetworkSyncResult(services.Count, routes.Count);
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Bus network sync started")]
    private partial void LogSyncStarted();

    [LoggerMessage(Level = LogLevel.Information, Message = "Bus network sync complete: {Services} services, {Routes} routes")]
    private partial void LogSyncComplete(int services, int routes);
}
