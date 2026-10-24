using Microsoft.AspNetCore.Http.HttpResults;
using OnLah.Api.Middleware;
using OnLah.Application.Common.Interfaces;
using OnLah.Application.TrainAlerts;
using OnLah.Domain.Common;

namespace OnLah.Api.Endpoints.TrainAlerts;

internal static class TrainAlertEndpoints
{
    internal static RouteGroupBuilder MapTrainAlertEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("train-alerts", GetAlertsAsync).NoStore();
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
                statusCode: result.Error.Kind == ErrorKind.Unavailable
                    ? StatusCodes.Status502BadGateway
                    : StatusCodes.Status500InternalServerError);

        return TypedResults.Ok(new TrainAlertsResponse(result.Value!, clock.UtcNow));
    }
}

internal sealed record TrainAlertsResponse(TrainAlertsResult Data, DateTimeOffset FetchedAt);
