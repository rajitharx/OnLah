using OnLah.Domain.BusNetwork;

namespace OnLah.Application.Common.Interfaces;

public interface ILtaBusNetworkClient
{
    IAsyncEnumerable<BusService> GetAllServicesAsync(CancellationToken cancellationToken = default);
    IAsyncEnumerable<BusRoute> GetAllRoutesAsync(CancellationToken cancellationToken = default);
}
