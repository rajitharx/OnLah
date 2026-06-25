using OnLah.Application.Common.Interfaces;
using OnLah.Domain.Common;

namespace OnLah.Application.TrainAlerts;

public sealed class GetTrainAlertsService
{
    private readonly ILtaTrainAlertClient _ltaClient;

    public GetTrainAlertsService(ILtaTrainAlertClient ltaClient) =>
        _ltaClient = ltaClient;

    public Task<Result<TrainAlertsResult>> GetAsync(CancellationToken cancellationToken = default) =>
        _ltaClient.GetAlertsAsync(cancellationToken);
}
