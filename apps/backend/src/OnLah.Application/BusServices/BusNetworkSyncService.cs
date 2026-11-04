using Microsoft.Extensions.Logging;
using OnLah.Application.Common;
using OnLah.Application.Common.Interfaces;
using OnLah.Domain.BusNetwork;
using OnLah.Domain.Common;

namespace OnLah.Application.BusServices;

public sealed record BusNetworkSyncResult(int ServicesSynced, int RoutesSynced);

// Reads the whole bus network from LTA before writing anything. A failed read leaves the stored copy as it was.
public sealed partial class BusNetworkSyncService
{
    private const string Resource = "BusNetworkSync";

    private readonly ILtaBusNetworkClient _lta;
    private readonly IBusNetworkRepository _repository;
    private readonly ILogger<BusNetworkSyncService> _logger;

    public BusNetworkSyncService(ILtaBusNetworkClient lta, IBusNetworkRepository repository, ILogger<BusNetworkSyncService> logger)
    {
        _lta = lta;
        _repository = repository;
        _logger = logger;
    }

    public async Task<Result<BusNetworkSyncResult>> SyncAsync(CancellationToken cancellationToken = default)
    {
        LogSyncStarted();
        var services = await _lta.GetAllServicesAsync(cancellationToken).ToListAsync(cancellationToken);
        var routes = await _lta.GetAllRoutesAsync(cancellationToken).ToListAsync(cancellationToken);

        var stored = await _repository.CountAsync(cancellationToken);
        if (!new ReplacementSize(services.Count, stored.Services).IsPlausible
            || !new ReplacementSize(routes.Count, stored.Routes).IsPlausible)
        {
            LogImplausibleReply(services.Count, routes.Count, stored.Services, stored.Routes);
            return DomainError.Unavailable(Resource);
        }

        if (!await _repository.ReplaceAllAsync(services, routes, cancellationToken))
            return DomainError.Conflict(Resource, "A bus network sync is already running.");

        LogSyncComplete(services.Count, routes.Count);
        return new BusNetworkSyncResult(services.Count, routes.Count);
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Bus network sync started")]
    private partial void LogSyncStarted();

    [LoggerMessage(Level = LogLevel.Warning,
        Message = "Bus network sync refused: LTA sent {Services} services and {Routes} routes against {StoredServices} and {StoredRoutes} stored")]
    private partial void LogImplausibleReply(int services, int routes, int storedServices, int storedRoutes);

    [LoggerMessage(Level = LogLevel.Information, Message = "Bus network sync complete: {Services} services, {Routes} routes")]
    private partial void LogSyncComplete(int services, int routes);
}
