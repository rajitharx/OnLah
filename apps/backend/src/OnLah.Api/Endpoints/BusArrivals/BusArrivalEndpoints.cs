using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using OnLah.Application.BusArrivals;
using OnLah.Application.Common.Interfaces;
using OnLah.Domain.Common;

namespace OnLah.Api.Endpoints.BusArrivals;

internal static class BusArrivalEndpoints
{
    internal static RouteGroupBuilder MapBusArrivalEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("bus-arrivals", GetArrivalsAsync);
        return group;
    }

    private static async Task<Results<Ok<BusArrivalsResponse>, ProblemHttpResult>> GetArrivalsAsync(
        string stopCode,
        GetBusArrivalsService service,
        IClock clock,
        IValidator<GetBusArrivalsRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(new GetBusArrivalsRequest(stopCode), cancellationToken);
        if (!validation.IsValid)
            return TypedResults.Problem(
                detail: string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)),
                statusCode: StatusCodes.Status422UnprocessableEntity);

        var result = await service.GetAsync(stopCode, cancellationToken);

        if (result.IsFailure)
            return TypedResults.Problem(
                detail: result.Error.Description,
                statusCode: StatusFor(result.Error.Kind));

        return TypedResults.Ok(new BusArrivalsResponse(stopCode, clock.UtcNow, result.Value!));
    }

    private static int StatusFor(ErrorKind kind) => kind switch
    {
        ErrorKind.NotFound => StatusCodes.Status404NotFound,
        ErrorKind.Unavailable => StatusCodes.Status502BadGateway,
        _ => StatusCodes.Status500InternalServerError
    };
}

internal sealed record GetBusArrivalsRequest(string StopCode);

internal sealed record BusArrivalsResponse(
    string StopCode,
    DateTimeOffset FetchedAt,
    IReadOnlyList<BusArrival> Services);

internal sealed class GetBusArrivalsValidator : AbstractValidator<GetBusArrivalsRequest>
{
    public GetBusArrivalsValidator()
    {
        RuleFor(x => x.StopCode)
            .NotEmpty()
            .Length(5)
            .Matches(@"^\d{5}$").WithMessage("StopCode must be a 5-digit numeric string.");
    }
}
