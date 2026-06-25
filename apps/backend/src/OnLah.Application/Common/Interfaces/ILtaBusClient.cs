using OnLah.Application.BusArrivals;
using OnLah.Domain.Common;

namespace OnLah.Application.Common.Interfaces;

public interface ILtaBusClient
{
    Task<Result<IReadOnlyList<BusArrival>>> GetArrivalsAsync(
        string stopCode,
        CancellationToken cancellationToken = default);
}
