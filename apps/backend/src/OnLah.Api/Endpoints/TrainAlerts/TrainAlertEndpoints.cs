using Microsoft.AspNetCore.Http.HttpResults;
using OnLah.Application.Common.Interfaces;
using OnLah.Application.TrainAlerts;

namespace OnLah.Api.Endpoints.TrainAlerts;

internal static class TrainAlertEndpoints
{
    internal static RouteGroupBuilder MapTrainAlertEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("train-alerts", GetAlertsAsync);
        return group;
    }

    private static async Task<Results<Ok<TrainAlertsResponse>, ProblemHttpResult>> GetAlertsAsync(
        GetTrainAlertsService service,
        IClock clock,
        CancellationToken cancellationToken)
    {
        var result = await service.GetAsync(cancellationToken);

        if (result.IsFailure)
            return TypedResults.Problem(
                detail: result.Error.Description,
                statusCode: StatusCodes.Status503ServiceUnavailable);

        return TypedResults.Ok(new TrainAlertsResponse(result.Value!, clock.UtcNow));
    }
}

internal sealed record TrainAlertsResponse(TrainAlertsResult Data, DateTimeOffset FetchedAt);
