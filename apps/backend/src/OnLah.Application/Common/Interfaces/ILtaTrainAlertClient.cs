using OnLah.Application.TrainAlerts;
using OnLah.Domain.Common;

namespace OnLah.Application.Common.Interfaces;

public interface ILtaTrainAlertClient
{
    Task<Result<TrainAlertsResult>> GetAlertsAsync(CancellationToken cancellationToken = default);
}
