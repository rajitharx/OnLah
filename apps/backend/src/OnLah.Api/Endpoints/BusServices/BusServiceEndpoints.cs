using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using OnLah.Api.Middleware;
using OnLah.Application.BusServices;
using OnLah.Domain.Common;

namespace OnLah.Api.Endpoints.BusServices;

internal static class BusServiceEndpoints
{
    private static readonly TimeSpan ReferenceDataMaxAge = TimeSpan.FromHours(1);

    internal static RouteGroupBuilder MapBusServiceEndpoints(this RouteGroupBuilder group)
    {
        group.MapGet("bus-services/{serviceNo}", GetDetailsAsync).CachePublic(ReferenceDataMaxAge);
        group.MapPost("admin/bus-network/sync", SyncAsync).AddEndpointFilter<AdminKeyFilter>();
        return group;
    }

    private static async Task<Results<Ok<BusServiceDetailsDto>, ProblemHttpResult>> GetDetailsAsync(
        string serviceNo,
        GetBusServiceDetailsService service,
        IValidator<GetBusServiceRequest> validator,
        CancellationToken cancellationToken)
    {
        var validation = await validator.ValidateAsync(new GetBusServiceRequest(serviceNo), cancellationToken);
        if (!validation.IsValid)
            return TypedResults.Problem(
                detail: string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)),
                statusCode: StatusCodes.Status422UnprocessableEntity);

        var result = await service.GetAsync(serviceNo.ToUpperInvariant(), cancellationToken);
        if (result.IsFailure)
            return TypedResults.Problem(
                detail: result.Error.Description,
                statusCode: result.Error.Kind == ErrorKind.NotFound
                    ? StatusCodes.Status404NotFound
                    : StatusCodes.Status500InternalServerError);

        return TypedResults.Ok(result.Value!);
    }

    private static async Task<Results<Ok<BusNetworkSyncResult>, ProblemHttpResult>> SyncAsync(
        BusNetworkSyncService syncService,
        CancellationToken cancellationToken)
    {
        try
        {
            return TypedResults.Ok(await syncService.SyncAsync(cancellationToken));
        }
        catch (Exception)
        {
            return TypedResults.Problem(
                detail: "Bus network sync failed. Check server logs for details.",
                statusCode: StatusCodes.Status502BadGateway);
        }
    }
}

internal sealed record GetBusServiceRequest(string ServiceNo);

internal sealed class GetBusServiceValidator : AbstractValidator<GetBusServiceRequest>
{
    public GetBusServiceValidator()
    {
        RuleFor(x => x.ServiceNo)
            .NotEmpty()
            .MaximumLength(10)
            .Matches(@"^[A-Za-z0-9]+\z").WithMessage("Service number must be letters and digits only.");
    }
}
