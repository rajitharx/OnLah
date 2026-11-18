using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using OnLah.Api.Middleware;
using OnLah.Application.RouteTracker;
using OnLah.Domain.Common;

namespace OnLah.Api.Endpoints.RouteTracker;

internal static class RouteTrackerEndpoints
{
    internal static RouteGroupBuilder MapRouteTrackerEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("route-tracker", GetAsync).NoStore();
        return group;
    }

    private static async Task<Results<Ok<RouteTrackerDto>, ProblemHttpResult>> GetAsync(
        string busStopCode,
        string serviceNo,
        int? direction,
        string? destinationCode,
        RouteTrackerService service,
        IValidator<GetRouteTrackerRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(new GetRouteTrackerRequest(busStopCode, serviceNo, direction, destinationCode), cancellationToken);
        if (!validation.IsValid)
            return TypedResults.Problem(
                detail: string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)),
                statusCode: StatusCodes.Status422UnprocessableEntity);

        var result = await service.GetAsync(busStopCode, serviceNo, direction, destinationCode, cancellationToken);
        if (result.IsFailure)
            return TypedResults.Problem(detail: result.Error.Description, statusCode: StatusFor(result.Error.Kind));

        return TypedResults.Ok(result.Value!);
    }

    private static int StatusFor(ErrorKind kind) => kind switch
    {
        ErrorKind.NotFound => StatusCodes.Status404NotFound,
        ErrorKind.Unavailable => StatusCodes.Status502BadGateway,
        _ => StatusCodes.Status500InternalServerError,
    };
}

internal sealed record GetRouteTrackerRequest(string BusStopCode, string ServiceNo, int? Direction, string? DestinationCode = null);

internal sealed class GetRouteTrackerValidator : AbstractValidator<GetRouteTrackerRequest>
{
    public GetRouteTrackerValidator()
    {
        RuleFor(x => x.BusStopCode)
            .NotEmpty()
            .MatchStopCodeFormat("BusStopCode");

        RuleFor(x => x.ServiceNo)
            .BeServiceNumber();

        RuleFor(x => x.Direction)
            .InclusiveBetween(1, 2).When(x => x.Direction is not null)
            .WithMessage("Direction must be 1 or 2.");

        RuleFor(x => x.DestinationCode)
            .MatchStopCodeFormat("DestinationCode").When(x => x.DestinationCode is not null);
    }
}
