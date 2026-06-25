using OnLah.Application.Common.Interfaces;
using OnLah.Domain.Common;

namespace OnLah.Application.BusArrivals;

public sealed class GetBusArrivalsService
{
    private readonly ILtaBusClient _ltaBusClient;

    public GetBusArrivalsService(ILtaBusClient ltaBusClient) =>
        _ltaBusClient = ltaBusClient;

    public Task<Result<IReadOnlyList<BusArrival>>> GetAsync(
        string stopCode,
        CancellationToken cancellationToken = default) =>
        _ltaBusClient.GetArrivalsAsync(stopCode, cancellationToken);
}
