using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using OnLah.Application.RouteTracker;
using OnLah.Domain.Common;

namespace OnLah.Api.Endpoints.RouteTracker;

internal static class RouteTrackerEndpoints
{
    internal static RouteGroupBuilder MapRouteTrackerEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("route-tracker", GetAsync);
        return group;
    }

    private static async Task<Results<Ok<RouteTrackerDto>, ProblemHttpResult>> GetAsync(
        string busStopCode,
        string serviceNo,
        int? direction,
        RouteTrackerService service,
        IValidator<GetRouteTrackerRequest> validator,
        HttpResponse response,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(new GetRouteTrackerRequest(busStopCode, serviceNo, direction), cancellationToken);
        if (!validation.IsValid)
            return TypedResults.Problem(
                detail: string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)),
                statusCode: StatusCodes.Status422UnprocessableEntity);

        var result = await service.GetAsync(busStopCode, serviceNo, direction, cancellationToken);
        if (result.IsFailure)
            return TypedResults.Problem(detail: result.Error.Description, statusCode: StatusFor(result.Error.Kind));

        response.Headers.CacheControl = "no-store";
        return TypedResults.Ok(result.Value!);
    }

    private static int StatusFor(ErrorKind kind) => kind switch
    {
        ErrorKind.NotFound => StatusCodes.Status404NotFound,
        ErrorKind.Unavailable => StatusCodes.Status502BadGateway,
        _ => StatusCodes.Status500InternalServerError,
    };
}

internal sealed record GetRouteTrackerRequest(string BusStopCode, string ServiceNo, int? Direction);

internal sealed class GetRouteTrackerValidator : AbstractValidator<GetRouteTrackerRequest>
{
    public GetRouteTrackerValidator()
    {
        RuleFor(x => x.BusStopCode)
            .NotEmpty()
            .Matches(@"^\d{5}$").WithMessage("BusStopCode must be a 5-digit numeric string.");

        RuleFor(x => x.ServiceNo)
            .NotEmpty()
            .MaximumLength(10)
            .Matches("^[A-Za-z0-9]+$").WithMessage("Service number must be letters and digits only.");

        RuleFor(x => x.Direction)
            .InclusiveBetween(1, 2).When(x => x.Direction is not null)
            .WithMessage("Direction must be 1 or 2.");
    }
}
