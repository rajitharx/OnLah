using OnLah.Application.RouteTracker;
using OnLah.Domain.Common;

namespace OnLah.Application.Common.Interfaces;

/// <summary>Bus arrivals with GPS positions. Every call goes to LTA, because live positions go stale in seconds.</summary>
public interface ILtaLiveArrivalClient
{
    Task<Result<IReadOnlyList<LiveServiceArrival>>> GetLiveArrivalsAsync(
        string stopCode,
        CancellationToken cancellationToken = default);
}
